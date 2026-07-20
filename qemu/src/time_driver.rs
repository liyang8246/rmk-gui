// Real embassy-time driver for QEMU virt RISC-V: reads mtime (CLINT MMIO)
// and arms mtimecmp to fire Machine Timer Interrupts.

use core::cell::RefCell;
use core::ptr;
use core::task::Waker;

use critical_section::Mutex as CsMutex;
use embassy_time_driver::{time_driver_impl, Driver};
use embassy_time_queue_utils::Queue;

// QEMU `virt` CLINT layout (SiFive CLINT; ACLINT-compatible).
const CLINT_BASE: usize = 0x0200_0000;
const MTIME: usize = CLINT_BASE + 0xBFF8; // 64-bit RO monotonic counter
const MTIMECMP: usize = CLINT_BASE + 0x4000; // hart 0, 64-bit RW compare

struct Inner {
    queue: Queue,
}

struct RiscVTimerDriver {
    inner: CsMutex<RefCell<Inner>>,
}

impl RiscVTimerDriver {
    const fn new() -> Self {
        Self {
            inner: CsMutex::new(RefCell::new(Inner {
                queue: Queue::new(),
            })),
        }
    }

    // RV32-safe 64-bit MMIO read of mtime.
    fn read_mtime() -> u64 {
        // SAFETY: MMIO read of a read-only register; no side effects.
        unsafe {
            loop {
                let hi = ptr::read_volatile((MTIME + 4) as *const u32) as u64;
                let lo = ptr::read_volatile(MTIME as *const u32) as u64;
                let hi2 = ptr::read_volatile((MTIME + 4) as *const u32) as u64;
                if hi == hi2 {
                    return lo | (hi << 32);
                }
            }
        }
    }

    // RV32-safe 64-bit MMIO write of mtimecmp using the -1 trick to avoid
    // spurious interrupts while the high word is being written.
    fn write_mtimecmp(value: u64) {
        let lo = (value & 0xFFFF_FFFF) as u32;
        let hi = (value >> 32) as u32;
        // SAFETY: MMIO write to the compare register; the -1 trick prevents
        // transient matches while the write is in progress.
        unsafe {
            ptr::write_volatile(MTIMECMP as *mut u32, 0xFFFF_FFFF);
            ptr::write_volatile((MTIMECMP + 4) as *mut u32, hi);
            ptr::write_volatile(MTIMECMP as *mut u32, lo);
        }
    }

    fn rearm(next_deadline: u64) {
        if next_deadline == u64::MAX {
            Self::write_mtimecmp(u64::MAX);
        } else {
            // Never arm a deadline at or before now — would loop forever.
            let now = Self::read_mtime();
            let target = next_deadline.max(now + 1);
            Self::write_mtimecmp(target);
        }
    }
}

time_driver_impl!(static DRIVER: RiscVTimerDriver = RiscVTimerDriver::new());

impl Driver for RiscVTimerDriver {
    fn now(&self) -> u64 {
        // 1 embassy tick == 1 rdtime tick (TICK_HZ == 10 MHz matches rdtime),
        // so no conversion is needed.
        Self::read_mtime()
    }

    fn schedule_wake(&self, at: u64, waker: &Waker) {
        critical_section::with(|cs| {
            let mut inner = self.inner.borrow_ref_mut(cs);
            if inner.queue.schedule_wake(at, waker) {
                let now = Self::read_mtime();
                let next = inner.queue.next_expiration(now);
                drop(inner);
                Self::rearm(next);
            }
        })
    }
}

// Called early in main before spawning tasks that use Timer.
pub fn init() {
    RiscVTimerDriver::write_mtimecmp(u64::MAX); // disarm before enabling IRQ
    // SAFETY: enabling the MTI source and global MIE; done after mtvec is set
    // by riscv-rt's _setup_interrupts (runs before main).
    unsafe {
        riscv::register::mie::set_mtimer();
        riscv::register::mstatus::set_mie();
    }
}

#[riscv_rt::core_interrupt(riscv::interrupt::Interrupt::MachineTimer)]
fn machine_timer() {
    critical_section::with(|cs| {
        let mut inner = DRIVER.inner.borrow_ref_mut(cs);
        let now = RiscVTimerDriver::read_mtime();
        let next = inner.queue.next_expiration(now);
        drop(inner);
        RiscVTimerDriver::rearm(next);
    });
    // Returns to _start_trap_rust, which restores the trap frame and runs mret
    // back to the interrupted context.
}

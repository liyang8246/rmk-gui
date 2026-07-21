use std::env;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

fn main() {
    let out = PathBuf::from(env::var_os("OUT_DIR").unwrap());

    for (name, bytes) in [("memory.x", include_bytes!("memory.x").as_slice())] {
        File::create(out.join(name)).unwrap().write_all(bytes).unwrap();
        println!("cargo:rerun-if-changed={name}");
    }
    println!("cargo:rustc-link-search={}", out.display());
    println!("cargo:rustc-link-arg-bins=-Tmemory.x");
    println!("cargo:rustc-link-arg-bins=-Tlink.x");

    let layout_toml = include_str!("keyboard.toml");
    let blob = rmk_config::layout_blob_from_toml(layout_toml)
        .expect("failed to build layout blob from keyboard.toml");
    let mut lit = String::from("pub static LAYOUT_BLOB: &[u8] = &[");
    for (i, b) in blob.iter().enumerate() {
        if i > 0 {
            lit.push_str(", ");
        }
        lit.push_str(&b.to_string());
    }
    lit.push_str("];\n");
    File::create(out.join("layout_blob.rs"))
        .unwrap()
        .write_all(lit.as_bytes())
        .unwrap();
    println!("cargo:rerun-if-changed=keyboard.toml");
}

/* @ts-self-types="./rynk_wasm.d.ts" */

/**
 * Live Rynk client handle exposed to JavaScript.
 *
 * Wraps the session's `Client` + `Driver`. All methods are `&self`: a parked
 * `next_topic()` pull and one request may run concurrently (full-duplex), but
 * keep requests serialized — the protocol allows a single request in flight.
 * Dropping the handle, or closing the JS link, ends the session; the link
 * itself stays open until the page closes it.
 */
export class RynkClient {
    static __wrap(ptr) {
        const obj = Object.create(RynkClient.prototype);
        obj.__wbg_ptr = ptr;
        RynkClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RynkClientFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rynkclient_free(ptr, 0);
    }
    /**
     * @returns {Promise<void>}
     */
    bootloader_jump() {
        const ret = wasm.rynkclient_bootloader_jump(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} slot
     * @returns {Promise<void>}
     */
    clear_ble_profile(slot) {
        const ret = wasm.rynkclient_clear_ble_profile(this.__wbg_ptr, slot);
        return ret;
    }
    /**
     * @returns {Promise<BatteryStatus>}
     */
    get_battery_status() {
        const ret = wasm.rynkclient_get_battery_status(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<BehaviorConfig>}
     */
    get_behavior() {
        const ret = wasm.rynkclient_get_behavior(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<BleStatus>}
     */
    get_ble_status() {
        const ret = wasm.rynkclient_get_ble_status(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<DeviceCapabilities>}
     */
    get_capabilities() {
        const ret = wasm.rynkclient_get_capabilities(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {Promise<Combo>}
     */
    get_combo(index) {
        const ret = wasm.rynkclient_get_combo(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} start_index
     * @returns {Promise<GetComboBulkResponse>}
     */
    get_combo_bulk(start_index) {
        const ret = wasm.rynkclient_get_combo_bulk(this.__wbg_ptr, start_index);
        return ret;
    }
    /**
     * @returns {Promise<ConnectionStatus>}
     */
    get_connection_status() {
        const ret = wasm.rynkclient_get_connection_status(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<ConnectionType>}
     */
    get_connection_type() {
        const ret = wasm.rynkclient_get_connection_type(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<number>}
     */
    get_current_layer() {
        const ret = wasm.rynkclient_get_current_layer(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<number>}
     */
    get_default_layer() {
        const ret = wasm.rynkclient_get_default_layer(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<DeviceInfo>}
     */
    get_device_info() {
        const ret = wasm.rynkclient_get_device_info(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} encoder_id
     * @param {number} layer
     * @returns {Promise<EncoderAction>}
     */
    get_encoder(encoder_id, layer) {
        const ret = wasm.rynkclient_get_encoder(this.__wbg_ptr, encoder_id, layer);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {Promise<Fork>}
     */
    get_fork(index) {
        const ret = wasm.rynkclient_get_fork(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} layer
     * @param {number} row
     * @param {number} col
     * @returns {Promise<KeyAction>}
     */
    get_key(layer, row, col) {
        const ret = wasm.rynkclient_get_key(this.__wbg_ptr, layer, row, col);
        return ret;
    }
    /**
     * @param {number} layer
     * @param {number} start_row
     * @param {number} start_col
     * @returns {Promise<GetKeymapBulkResponse>}
     */
    get_keymap_bulk(layer, start_row, start_col) {
        const ret = wasm.rynkclient_get_keymap_bulk(this.__wbg_ptr, layer, start_row, start_col);
        return ret;
    }
    /**
     * @returns {Promise<LayoutInfo>}
     */
    get_layout() {
        const ret = wasm.rynkclient_get_layout(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<LedIndicator>}
     */
    get_led_indicator() {
        const ret = wasm.rynkclient_get_led_indicator(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<LockStatus>}
     */
    get_lock_status() {
        const ret = wasm.rynkclient_get_lock_status(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} offset
     * @returns {Promise<MacroData>}
     */
    get_macro(offset) {
        const ret = wasm.rynkclient_get_macro(this.__wbg_ptr, offset);
        return ret;
    }
    /**
     * @returns {Promise<MatrixState>}
     */
    get_matrix_state() {
        const ret = wasm.rynkclient_get_matrix_state(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {Promise<Morse>}
     */
    get_morse(index) {
        const ret = wasm.rynkclient_get_morse(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} start_index
     * @returns {Promise<GetMorseBulkResponse>}
     */
    get_morse_bulk(start_index) {
        const ret = wasm.rynkclient_get_morse_bulk(this.__wbg_ptr, start_index);
        return ret;
    }
    /**
     * @param {number} slot
     * @returns {Promise<PeripheralStatus>}
     */
    get_peripheral_status(slot) {
        const ret = wasm.rynkclient_get_peripheral_status(this.__wbg_ptr, slot);
        return ret;
    }
    /**
     * @returns {Promise<boolean>}
     */
    get_sleep_state() {
        const ret = wasm.rynkclient_get_sleep_state(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<ProtocolVersion>}
     */
    get_version() {
        const ret = wasm.rynkclient_get_version(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<number>}
     */
    get_wpm() {
        const ret = wasm.rynkclient_get_wpm(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    lock() {
        const ret = wasm.rynkclient_lock(this.__wbg_ptr);
        return ret;
    }
    /**
     * Pull the next recognized topic push (server→host). Parks until one
     * arrives; rejects when the link dies. Unrecognized topics are skipped.
     * JS drives this in a loop, like the native `next_topic()` pull, and it
     * runs concurrently with the request methods.
     * @returns {Promise<TopicEvent>}
     */
    next_topic() {
        const ret = wasm.rynkclient_next_topic(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    reboot() {
        const ret = wasm.rynkclient_reboot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {BehaviorConfig} config
     * @returns {Promise<void>}
     */
    set_behavior(config) {
        const ret = wasm.rynkclient_set_behavior(this.__wbg_ptr, config);
        return ret;
    }
    /**
     * @param {number} index
     * @param {Combo} config
     * @returns {Promise<void>}
     */
    set_combo(index, config) {
        const ret = wasm.rynkclient_set_combo(this.__wbg_ptr, index, config);
        return ret;
    }
    /**
     * @param {SetComboBulkRequest} request
     * @returns {Promise<void>}
     */
    set_combo_bulk(request) {
        const ret = wasm.rynkclient_set_combo_bulk(this.__wbg_ptr, request);
        return ret;
    }
    /**
     * @param {number} layer
     * @returns {Promise<void>}
     */
    set_default_layer(layer) {
        const ret = wasm.rynkclient_set_default_layer(this.__wbg_ptr, layer);
        return ret;
    }
    /**
     * @param {number} encoder_id
     * @param {number} layer
     * @param {EncoderAction} action
     * @returns {Promise<void>}
     */
    set_encoder(encoder_id, layer, action) {
        const ret = wasm.rynkclient_set_encoder(this.__wbg_ptr, encoder_id, layer, action);
        return ret;
    }
    /**
     * @param {number} index
     * @param {Fork} config
     * @returns {Promise<void>}
     */
    set_fork(index, config) {
        const ret = wasm.rynkclient_set_fork(this.__wbg_ptr, index, config);
        return ret;
    }
    /**
     * @param {number} layer
     * @param {number} row
     * @param {number} col
     * @param {KeyAction} action
     * @returns {Promise<void>}
     */
    set_key(layer, row, col, action) {
        const ret = wasm.rynkclient_set_key(this.__wbg_ptr, layer, row, col, action);
        return ret;
    }
    /**
     * @param {SetKeymapBulkRequest} request
     * @returns {Promise<void>}
     */
    set_keymap_bulk(request) {
        const ret = wasm.rynkclient_set_keymap_bulk(this.__wbg_ptr, request);
        return ret;
    }
    /**
     * @param {number} offset
     * @param {MacroData} data
     * @returns {Promise<void>}
     */
    set_macro(offset, data) {
        const ret = wasm.rynkclient_set_macro(this.__wbg_ptr, offset, data);
        return ret;
    }
    /**
     * @param {number} index
     * @param {Morse} config
     * @returns {Promise<void>}
     */
    set_morse(index, config) {
        const ret = wasm.rynkclient_set_morse(this.__wbg_ptr, index, config);
        return ret;
    }
    /**
     * @param {SetMorseBulkRequest} request
     * @returns {Promise<void>}
     */
    set_morse_bulk(request) {
        const ret = wasm.rynkclient_set_morse_bulk(this.__wbg_ptr, request);
        return ret;
    }
    /**
     * @param {StorageResetMode} mode
     * @returns {Promise<void>}
     */
    storage_reset(mode) {
        const ret = wasm.rynkclient_storage_reset(this.__wbg_ptr, mode);
        return ret;
    }
    /**
     * @param {number} slot
     * @returns {Promise<void>}
     */
    switch_ble_profile(slot) {
        const ret = wasm.rynkclient_switch_ble_profile(this.__wbg_ptr, slot);
        return ret;
    }
    /**
     * @returns {Promise<LockStatus>}
     */
    unlock_poll() {
        const ret = wasm.rynkclient_unlock_poll(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) RynkClient.prototype[Symbol.dispose] = RynkClient.prototype.free;

/**
 * Handshake over an already-open JS link and return a client. The link is the
 * web transport's [`RynkDevice`], so the browser path uses the same connect
 * lifecycle as the native serial/BLE transports.
 * @param {any} link
 * @returns {Promise<RynkClient>}
 */
export function connect(link) {
    const ret = wasm.connect(link);
    return ret;
}

export function init() {
    wasm.init();
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_92b29b0548f8b746: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_9a4e0ecb0fa16705: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_boolean_get_fa956cfa2d1bd751: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_c25d447a39f5578f: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_aca499c5de7ff5e5: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_function_1ff95bcc5517c252: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_a27215656b807791: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_ea5e6cc2e4141dfe: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_c05833b95a3cf397: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_db4c3b15f63fc170: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_394265ed1e1b84ee: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_b0ca35b86a603356: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_fffb441def202758: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_call_8a2dd23819f8a60a: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_a6e5c5dce5018821: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_debug_87fd9b1a625b7efb: function(arg0) {
            console.debug(arg0);
        },
        __wbg_done_89b2b13e91a60321: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_015dc610cd81ede0: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_error_744744ff0c9861e6: function(arg0) {
            console.error(arg0);
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_get_507a50627bffa49b: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_c7eb1f358a7654df: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_6e0ad6d2a41b06f6: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_info_eadbe775a8e2e9eb: function(arg0) {
            console.info(arg0);
        },
        __wbg_instanceof_ArrayBuffer_4480b9e0068a8adb: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_309b927aaf7a3fc7: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_0677c962b281d01a: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_04f36e4056f1b851: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_6f722e4a93058b71: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_1f0964f4a5e2c6d8: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_370319915dc99107: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_log_d267660666346fb3: function(arg0) {
            console.log(arg0);
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_32b398fb48b6d94a: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_b667d279fd5aa943: function(arg0, arg1) {
            const ret = new Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_cd45aabdf6073e84: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_da52cf8fe3429cb2: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_from_slice_77cdfb7977362f3c: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_typed_1824d93f294193e5: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen__convert__closures_____invoke__h7692e81cabd6b936(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_next_6dbf2c0ac8cde20f: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_71f2aa1cb3d1e37e: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_prototypesetcall_4770620bbe4688a0: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_queueMicrotask_0ab5b2d2393e99b9: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_6a09b7bc46549209: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_recv_bfa98f8a281aca2f: function() { return handleError(function (arg0) {
            const ret = arg0.recv();
            return ret;
        }, arguments); },
        __wbg_resolve_2191a4dfe481c25b: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_rynkclient_new: function(arg0) {
            const ret = RynkClient.__wrap(arg0);
            return ret;
        },
        __wbg_send_4f18ae5d763f4002: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.send(arg1);
            return ret;
        }, arguments); },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_8a16b38e4805b298: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_name_3bbc583faefa4193: function(arg0, arg1, arg2) {
            arg0.name = getStringFromWasm0(arg1, arg2);
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_4ef717fb391d88b7: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_8d1badc68b5a74f4: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_146583524fe1469b: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f2829a2234d7819e: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_then_16d107c451e9905d: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_6ec10ae38b3e92f7: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_value_a5d5488a9589444a: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_warn_b1370d804fa3e259: function(arg0) {
            console.warn(arg0);
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 318, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen__convert__closures_____invoke__h8e283c808a45b4aa);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./rynk_wasm_bg.js": import0,
    };
}

function wasm_bindgen__convert__closures_____invoke__h8e283c808a45b4aa(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__h8e283c808a45b4aa(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen__convert__closures_____invoke__h7692e81cabd6b936(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures_____invoke__h7692e81cabd6b936(arg0, arg1, arg2, arg3);
}

const RynkClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rynkclient_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('rynk_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };

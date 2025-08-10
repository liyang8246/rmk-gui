# Changelog

## [0.3.1](https://github.com/liyang8246/rmk-gui/compare/v0.3.0...v0.3.1) (2025-08-10)


### Bug Fixes

* **ui:** fix keys display overflow ([38577b9](https://github.com/liyang8246/rmk-gui/commit/38577b977a105e25e26a1af2071d26c1567d3cec))

## [0.3.0](https://github.com/liyang8246/rmk-gui/compare/v0.2.0...v0.3.0) (2025-04-09)


### Features

* **app:** add global error handling and toaster component ([9a8a8ea](https://github.com/liyang8246/rmk-gui/commit/9a8a8ea8888f78aa2bad0c6d84eaa64647392f2b))
* **ble:** ble hid work on windows ([cec86af](https://github.com/liyang8246/rmk-gui/commit/cec86af09cfd44786ebe899c194f5164b484b7d0))
* **ble:** ble hid work on windows ([e351fd9](https://github.com/liyang8246/rmk-gui/commit/e351fd9e3dfbef1b9e102a31aff22cceb14d84f1))
* delay macro ([ecfa811](https://github.com/liyang8246/rmk-gui/commit/ecfa81136910cb4e1ce8bfb5d11d59a8bd8749cd))
* **error:** show error toast when no keyboard is found ([f9a1938](https://github.com/liyang8246/rmk-gui/commit/f9a1938417e23c6e97d13b0a1c5014593a59ed36))
* **keyboard:** add macro state to keyboard object ([99d51e4](https://github.com/liyang8246/rmk-gui/commit/99d51e442e1ec23384cddc6eaa6a43b2972ae037))
* **macro:** Initial completion of reading macro config ([9ae7f66](https://github.com/liyang8246/rmk-gui/commit/9ae7f6609cfd8f2df535742fa0e1e489908cf6ea))
* **macro:** Initial completion of reading macro config ([ac240c8](https://github.com/liyang8246/rmk-gui/commit/ac240c81e2899b24785e821f8f037c50465fde88))
* **macros:** implement macro deserialization and fetching ([ce7c22f](https://github.com/liyang8246/rmk-gui/commit/ce7c22fd5a62b4989589d6339f53f5d60025af71))
* maintain the same width for different texts ([37057df](https://github.com/liyang8246/rmk-gui/commit/37057dfddcb5e999917f96b33cfe3d2b2de0f310))
* **nuxt:** add color mode module and configure color mode ([d2e7036](https://github.com/liyang8246/rmk-gui/commit/d2e7036238d7c89daf9e7224b47029aa28b60e8a))
* **tauri:** return deserialized macros from get_marcoes command ([615a57e](https://github.com/liyang8246/rmk-gui/commit/615a57e69ecc7e1d0d10c3a8aeb7b60151a6d711))
* **ui:** add input and number field components ([75103a6](https://github.com/liyang8246/rmk-gui/commit/75103a645ea52ea4e863b7e72552f78e7d4359c6))
* **ui:** implement drawer component ([38bfe19](https://github.com/liyang8246/rmk-gui/commit/38bfe190743ae6e8c64205daecd04e2005782835))
* **ui:** implement toast component ([615602e](https://github.com/liyang8246/rmk-gui/commit/615602ee7d4a64fde1a0e294c935c8324de2f796))
* **ui:** show toast when invoke error ([dce9095](https://github.com/liyang8246/rmk-gui/commit/dce909506647704d723d797ddc7e7df66dbe16b9))


### Bug Fixes

* **drawer:** add type annotation for forwarded prop ([4d17880](https://github.com/liyang8246/rmk-gui/commit/4d178801788475654693d688372746ac0da2015d))
* **kbd:** adjust macro count ([4385b41](https://github.com/liyang8246/rmk-gui/commit/4385b414eefa3cfed340371b1e547f2756a8231e))
* **keymap:** unnecessary performance overhead ([dd1b4a3](https://github.com/liyang8246/rmk-gui/commit/dd1b4a35896ddfe08053ab1756d3e97af76afc97))

## [0.2.0](https://github.com/liyang8246/rmk-gui/compare/v0.1.0...v0.2.0) (2025-03-15)


### Features

* **components:** add Selector component ([4ba8f38](https://github.com/liyang8246/rmk-gui/commit/4ba8f38aab9dfc05cdeab357ca81821cf2a09479))
* **keymap:** support switch layer ([9efddb1](https://github.com/liyang8246/rmk-gui/commit/9efddb196eca4db0b69cf17b2164d931e118a7cc))
* **keymap:** support switch layer ([01cd43b](https://github.com/liyang8246/rmk-gui/commit/01cd43b0a3c8d26eecae09ac0ff3c4728b73e98f))
* **ui:** add select component ([2908467](https://github.com/liyang8246/rmk-gui/commit/2908467239a33eb6f93deb11458995ddc1cfed97))


### Bug Fixes

* **app:** correct evaluation of selected device path ([5d38456](https://github.com/liyang8246/rmk-gui/commit/5d3845602d7f83d1d4e20039f04b091306f60be6))

## [0.1.0](https://github.com/liyang8246/rmk-gui/compare/v0.0.1...v0.1.0) (2025-03-11)


### Features

* **app:** implement device selection and connection functionality ([d200ee5](https://github.com/liyang8246/rmk-gui/commit/d200ee5c69042721df3e350e5faee920ecf5b32d))
* **gui:** adjust window dimensions and minimum height ([56b5096](https://github.com/liyang8246/rmk-gui/commit/56b509681594bbba92025da1b5344fb68aa93fce))
* **Key:** add rotation and translation support ([9a26f92](https://github.com/liyang8246/rmk-gui/commit/9a26f9255ee5fbff8f8d717a5f07e4a80e866102))
* **Key:** add rotation and translation support ([5ff84cf](https://github.com/liyang8246/rmk-gui/commit/5ff84cf7edd891b67ce728ed5d33f2676bace838))
* **keyboard:** add rotation_x and rotation_y fields to Key struct ([b29f429](https://github.com/liyang8246/rmk-gui/commit/b29f429fb50b323ecc68d976098b3cf952469316))
* **keyboard:** implement layer row column selection and update keymap ([c90a008](https://github.com/liyang8246/rmk-gui/commit/c90a008ecc1aed79bf7053890e48c7a7b7d51569))
* **KeyBoard:** implement multi-layer keymap support ([f2628e8](https://github.com/liyang8246/rmk-gui/commit/f2628e8d322885ef64987fe19c4e22b91aa221da))
* **Key:** implement dual-layer keycap rendering ([d020963](https://github.com/liyang8246/rmk-gui/commit/d0209635b506e86303b9e91982852849b89c69a4))
* **Key:** implement dual-layer keycap rendering ([bdbacf7](https://github.com/liyang8246/rmk-gui/commit/bdbacf756147fa04961215c23ebac4cbbe60ae1f))
* **keymap:** add keyboard event listener for keymapping ([5745748](https://github.com/liyang8246/rmk-gui/commit/57457488dc491b023cd91abb6766a13612edf51e))
* **keymap:** implement radio button functionality for key selection ([9b6bd75](https://github.com/liyang8246/rmk-gui/commit/9b6bd75ba92d6ae4fae691d29e48bd0bcd77e046))


### Bug Fixes

* **app:** connect to device and update keymap on select ([8132813](https://github.com/liyang8246/rmk-gui/commit/8132813333cbc02880c79d11c0acd814e685bc64))
* **Key:** adjust key dimensions and spacing ([ce666df](https://github.com/liyang8246/rmk-gui/commit/ce666df7ff08dee5d2d03a0c161c22e512b77ab6))
* **Key:** adjust key dimensions and spacing.  and - style(Key): adjust outline style and color ([152c434](https://github.com/liyang8246/rmk-gui/commit/152c434e432ac4ab2e4e4ac51bd555d1fc447ca7))

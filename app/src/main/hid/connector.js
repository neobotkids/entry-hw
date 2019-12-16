const HID = require('node-hid');
const BaseConnector = require('../BaseConnector');

class HidConnector extends BaseConnector {
    open(path) {
        this.connected = false;
        /**
         * @type {number[]}
         */
        this.registeredIntervals = [];
        this.device = new HID.HID(path);
        return this.device;
    }

    initialize() {
        return new Promise((resolve, reject) => {
            const { isInitialCheck = true } = this.options;
            const hwModule = this.hwModule;
            if (isInitialCheck &&
                hwModule.requestInitialData &&
                hwModule.checkInitialData
            ) {
                this.device.on('data', (data) => {
                    const result = hwModule.checkInitialData(data, this.options);
                    if (result === undefined) {
                        this.send(hwModule.requestInitialData());
                    } else {
                        this.device.removeAllListeners('data');
                        if (result === true) {
                            if (hwModule.setSerialPort) {
                                this.hwModule.setSerialPort(this.device);
                            }
                            if (hwModule.registerIntervalSend) {
                                this.hwModule.registerIntervalSend(
                                    this._registerIntervalSend.bind(this),
                                );
                            }
                            this.connected = true;
                            resolve();
                        } else {
                            reject(new Error('Invalid hardware'));
                        }
                    }
                    console.log(result, data);
                });
                this.device.on('error', reject);
                this.send(hwModule.requestInitialData());
            } else {
                this.connected = true;
                resolve();
            }
        });
    }

    /**
     * 디바이스에 데이터를 보낸다. write 는 기본적으로 동기동작한다.
     * featureReport 를 따로 입력하지 않으면 0x00 으로 간주한다.
     * @see https://github.com/node-hid/node-hid#devicewritedata
     * @param data {string[]}
     * @param type {string="output"}
     * @returns {number} 사실 딱히 쓸모는 없다.
     */
    send(data, type = 'output') {
        if (this.device) {
            try {
                const writer =
                    type === 'feature'
                        ? this.device.sendFeatureReport
                        : this.device.write;
                return this.device.write(data);
            } catch (e) {
                console.error(e);
            }
        }
    }

    connect() {
        if (!this.router) {
            throw new Error('router must be set');
        }

        if (!this.device) {
            throw new Error('device must be set');
        }

        const router = this.router;
        const hwModule = this.hwModule;
        const { duration = BaseConnector.DEFAULT_SLAVE_DURATION } = this.options;

        if (hwModule.connect) {
            hwModule.connect();
        }
        this.sendState('connect');

        if (hwModule.afterConnect) {
            hwModule.afterConnect(this);
        }

        this.device.on('data', (data) => {
            if (
                !hwModule.validateLocalData ||
                hwModule.validateLocalData(data)
            ) {
                if (!this.connected) {
                    this.connected = true;
                    this.sendState('connected');
                }

                this.received = true;
                let result = data;
                if (hwModule.handleLocalData) {
                    result = hwModule.handleLocalData(result);
                }

                // 서버로 데이터를 요청한다.
                router.setHandlerData();
                router.sendEncodedDataToServer(/*result*/);
            }
        });

        this.device.on('error', (e) => {
            console.log('ERROR', e);
            this.close();
            this.sendState('disconnected');
        });

        if (hwModule.requestLocalData) {
            this.requestLocalDataInterval = setInterval(() => {
                this.send(hwModule.requestLocalData());
            }, duration);
        }
    }

    _registerIntervalSend(sendDataFunction, interval) {
        this.registeredIntervals.push(setInterval(() => {
            const data = sendDataFunction();
            data && this.send(data);
        }, interval));
    }

    close() {
        this.connected = false;
        this.registeredIntervals.forEach(clearInterval);
        this.requestLocalDataInterval && clearInterval(this.requestLocalDataInterval);
        this.device.removeAllListeners();
        if (this.device) {
            this.device.close();
        }
    }
}

module.exports = HidConnector;
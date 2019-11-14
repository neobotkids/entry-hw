import React from 'react';
import { CloudModeTypesEnum, HardwareModuleStateEnum, HardwarePageStateEnum } from '../constants/constants';
import {
    changeAlertMessage,
    changeCloudMode,
    changeHardwareModuleState,
    changeStateTitle,
    IAlertMessage,
} from '../store/modules/common';
import { changePortList } from '../store/modules/connection';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../store';

const { translator, ipcRenderer } = window;

type IProps = IStateProps & IDispatchProps;

class IpcRendererWatchComponent extends React.PureComponent<IProps> {
    constructor(props: Readonly<IProps>) {
        super(props);

        ipcRenderer.on('console', (event: Electron.Event, ...args: any[]) => {
            console.log(...args);
        });

        ipcRenderer.on('state', (event: Electron.Event, state: HardwareModuleStateEnum) => {
            const applyTitle = (title: string) => {
                props.changeStateTitle(translator.translate(title));
            };
            props.changeHardwareModuleState(state);
            console.log('state changed: ', state);

            switch (state) {
                case HardwareModuleStateEnum.disconnected: {
                    if (props.currentPageState === HardwarePageStateEnum.list) {
                        applyTitle('Select hardware');
                    } else {
                        applyTitle('hardware > disconnected');
                        props.changeAlertMessage({
                            message: translator.translate(
                                'Hardware device is disconnected. Please restart this program.',
                            ),
                        });
                    }
                    break;
                }
                case HardwareModuleStateEnum.connected: {
                    applyTitle('hardware > connected');
                    props.changeAlertMessage({
                        message: translator.translate('Connected to hardware device.'),
                        duration: 2000,
                    });
                    break;
                }
                case HardwareModuleStateEnum.scan:
                case HardwareModuleStateEnum.lost: {
                    applyTitle('hardware > connecting');
                    props.changeAlertMessage({
                        message: translator.translate('Connecting to hardware device.'),
                    });
                    break;
                }
                case HardwareModuleStateEnum.beforeConnect: {
                    applyTitle('hardware > connecting');
                    const beforeConnectMessage = `${
                        translator.translate('Connecting to hardware device.')
                    } ${
                        translator.translate('Please select the firmware.')
                    }`;
                    props.changeAlertMessage({
                        message: beforeConnectMessage,
                    });
                    break;
                }
            }
        });
        ipcRenderer.on('portListScanned', (event: Electron.Event, data: ISerialPortScanData[]) => {
            props.changePortList(data);
        });
        ipcRenderer.on('cloudMode', (event: Electron.Event, mode: CloudModeTypesEnum) => {
            props.changeCloudMode(mode);
        });
    }

    render() {
        return null;
    }
}

interface IStateProps {
    currentPageState: HardwarePageStateEnum,
    currentModuleState: HardwareModuleStateEnum,
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    currentPageState: state.common.currentPageState,
    currentModuleState: state.common.moduleState,
});

interface IDispatchProps {
    changeStateTitle: (title: string) => void;
    changeCloudMode: (mode: CloudModeTypesEnum) => void;
    changePortList: (portList: ISerialPortScanData[]) => void;
    changeAlertMessage: (alertMessage: IAlertMessage) => void;
    changeHardwareModuleState: (state: HardwareModuleStateEnum) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeStateTitle: changeStateTitle(dispatch),
    changeCloudMode: changeCloudMode(dispatch),
    changePortList: changePortList(dispatch),
    changeAlertMessage: changeAlertMessage(dispatch),
    changeHardwareModuleState: changeHardwareModuleState(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(IpcRendererWatchComponent);

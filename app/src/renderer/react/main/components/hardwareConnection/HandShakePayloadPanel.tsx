import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { setHandshakePayload } from '../../store/modules/connection';
import RightConnectionArrowImage from '../../../../images/connection-arrow.png';
import LeftConnectionArrowImage from '../../../../images/connection-arrow-2.png';

const Container = styled.div`
    width: 240px;
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const IndicateTextDiv = styled.div`
    font-size: 12px;
    font-weight: bold;
    color: #979797;
    
    margin-bottom: 25px;
`;

const SendButton = styled.button<{active: boolean}>`
    width: 62px;
    height: 40px;
    border-radius: 4px;
    border: ${({ active }) => (active ? 'none' : 'solid 1px #e2e2e2')}
    background-color: ${({ active }) => (active ? '#4f80ff' : '#f9f9f9')};
    
    letter-spacing: -0.33px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: ${({ active }) => (active ? '#ffffff' : '#cbcbcb')};
`;

const SendInput = styled.input`
    width: 62px;
    height: 40px;
    border-radius: 4px;
    border: solid 1px #e2e2e2;
    background-color: #ffffff;
    
    letter-spacing: -0.33px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #2c313d;
`;

const ArrowImageDiv = styled.div<{image: string}>`
    min-height: 40px;
    line-height: 40px;
    background-image: url(${props => props.image});
    background-repeat: no-repeat;
    background-position: center;
    
    margin-bottom: 16px;
`;

const HandShakePayloadPanel: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isReady, setReadyState] = useState(false);
    const dispatch = useDispatch();

    const onPayloadChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setReadyState(!!/^[a-zA-Z0-9]+$/.exec(value)); // 영숫자만 허용한다
    }, []);

    const onButtonClicked = useCallback(() => {
        const value = inputRef?.current?.value;
        setHandshakePayload(dispatch)(value);
    }, []);

    return (
        <Container>
            <div>
                <IndicateTextDiv>하드웨어 연결을 위한 값을 입력해 주세요.</IndicateTextDiv>
                <ArrowImageDiv image={LeftConnectionArrowImage}>
                    <SendInput onChange={onPayloadChanged} ref={inputRef}/>
                </ArrowImageDiv>
                <ArrowImageDiv image={RightConnectionArrowImage}>
                    <SendButton onClick={onButtonClicked} active={isReady}>설정</SendButton>
                </ArrowImageDiv>
            </div>
        </Container>
    );
};

export default HandShakePayloadPanel;
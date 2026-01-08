import { render, screen, fireEvent, act } from '@testing-library/react';
import { DrawOfferDialog } from '@/components/game/DrawOfferDialog';
import { UndoRequestDialog } from '@/components/game/UndoRequestDialog';
import { useGameStore } from '@/store/gameStore';
import * as socketClient from '@/lib/multiplayer/socketClient';

// Mock socket client
jest.mock('@/lib/multiplayer/socketClient', () => ({
    requestDraw: jest.fn(),
    respondDraw: jest.fn(),
    requestUndo: jest.fn(),
    respondUndo: jest.fn(),
    surrender: jest.fn(),
    getSocket: jest.fn(() => ({
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    })),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

describe('Draw and Undo Functionality', () => {
    beforeEach(() => {
        useGameStore.setState({
            isOnline: true,
            roomId: 'test-room',
            drawRequestReceived: false,
            undoRequestReceived: false,
            requestingPlayerName: null,
        });
        jest.clearAllMocks();
    });

    describe('DrawOfferDialog', () => {
        it('renders when open', () => {
            render(
                <DrawOfferDialog
                    isOpen={true}
                    onAccept={jest.fn()}
                    onReject={jest.fn()}
                    requestingPlayerName="Test Player"
                />
            );
            expect(screen.getByText('提和请求')).toBeInTheDocument();
            expect(screen.getByText('Test Player 请求和棋，是否同意？')).toBeInTheDocument();
        });

        it('calls onAccept when accept button clicked', () => {
            const onAccept = jest.fn();
            render(
                <DrawOfferDialog
                    isOpen={true}
                    onAccept={onAccept}
                    onReject={jest.fn()}
                    requestingPlayerName="Test Player"
                />
            );
            fireEvent.click(screen.getByText('同意和棋'));
            expect(onAccept).toHaveBeenCalled();
        });

        it('calls onReject when reject button clicked', () => {
            const onReject = jest.fn();
            render(
                <DrawOfferDialog
                    isOpen={true}
                    onAccept={jest.fn()}
                    onReject={onReject}
                    requestingPlayerName="Test Player"
                />
            );
            fireEvent.click(screen.getByText('拒绝'));
            expect(onReject).toHaveBeenCalled();
        });
    });

    describe('UndoRequestDialog', () => {
        it('renders when open', () => {
            render(
                <UndoRequestDialog
                    isOpen={true}
                    onAccept={jest.fn()}
                    onReject={jest.fn()}
                    requestingPlayerName="Test Player"
                />
            );
            expect(screen.getByText('悔棋请求')).toBeInTheDocument();
            expect(screen.getByText('Test Player 请求悔棋，是否同意？')).toBeInTheDocument();
        });
    });

    describe('GameStore Actions', () => {
        it('requestDraw calls socketRequestDraw', () => {
            const { requestDraw } = useGameStore.getState();
            requestDraw();
            expect(socketClient.requestDraw).toHaveBeenCalledWith(
                { roomId: 'test-room' },
                expect.any(Function)
            );
        });

        it('acceptDraw calls socketRespondDraw with true', () => {
            const { acceptDraw } = useGameStore.getState();
            acceptDraw();
            expect(socketClient.respondDraw).toHaveBeenCalledWith(
                { roomId: 'test-room', accept: true },
                expect.any(Function)
            );
        });

        it('rejectDraw calls socketRespondDraw with false', () => {
            const { rejectDraw } = useGameStore.getState();
            rejectDraw();
            expect(socketClient.respondDraw).toHaveBeenCalledWith(
                { roomId: 'test-room', accept: false },
                expect.any(Function)
            );
        });

        it('requestUndo calls socketRequestUndo', () => {
            const { requestUndo } = useGameStore.getState();
            requestUndo();
            expect(socketClient.requestUndo).toHaveBeenCalledWith(
                { roomId: 'test-room' },
                expect.any(Function)
            );
        });

        it('surrender calls socketSurrender', () => {
            // Mock window.confirm
            window.confirm = jest.fn(() => true);
            const { surrender } = useGameStore.getState();
            surrender();
            expect(socketClient.surrender).toHaveBeenCalledWith(
                { roomId: 'test-room' },
                expect.any(Function)
            );
        });
    });
});

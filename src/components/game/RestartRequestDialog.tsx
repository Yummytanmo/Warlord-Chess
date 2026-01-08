import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface RestartRequestDialogProps {
    isOpen: boolean;
    onAccept: () => void;
    onReject: () => void;
    requestingPlayerName: string;
}

export const RestartRequestDialog: React.FC<RestartRequestDialogProps> = ({
    isOpen,
    onAccept,
    onReject,
    requestingPlayerName,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onReject()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>重新开始请求</DialogTitle>
                    <DialogDescription>
                        {requestingPlayerName} 请求重新开始游戏。
                        <br />
                        如果同意，棋盘将被重置，但双方保留当前武将。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:justify-center">
                    <Button variant="outline" onClick={onReject} className="flex-1">
                        拒绝
                    </Button>
                    <Button onClick={onAccept} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        同意重新开始
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

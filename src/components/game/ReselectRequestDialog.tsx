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

interface ReselectRequestDialogProps {
    isOpen: boolean;
    onAccept: () => void;
    onReject: () => void;
    requestingPlayerName: string;
}

export const ReselectRequestDialog: React.FC<ReselectRequestDialogProps> = ({
    isOpen,
    onAccept,
    onReject,
    requestingPlayerName,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onReject()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>重选武将请求</DialogTitle>
                    <DialogDescription>
                        {requestingPlayerName} 请求重新选择武将。
                        <br />
                        如果同意，游戏将结束，双方返回武将选择阶段。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:justify-center">
                    <Button variant="outline" onClick={onReject} className="flex-1">
                        拒绝
                    </Button>
                    <Button onClick={onAccept} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        同意重选
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

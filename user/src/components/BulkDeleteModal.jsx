import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/contexts/ThemeContext'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2 } from 'lucide-react'

function BulkDeleteModal({ itemCount, onClose, onConfirm, isDeleting = false }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [confirmText, setConfirmText] = useState('')

    const canDelete = confirmText === 'DELETE'

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && canDelete && !isDeleting) {
            onConfirm()
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <span>Delete {itemCount} item{itemCount !== 1 ? 's' : ''}?</span>
                    </DialogTitle>
                    <DialogDescription className="pt-3">
                        This action cannot be undone. The selected items will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <p className="text-sm" style={{ color: isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)' }}>
                        To confirm, type <strong className="text-destructive font-mono">DELETE</strong> below:
                    </p>
                    <Input
                        placeholder="Type DELETE to confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="font-mono"
                        style={{
                            borderColor: confirmText && !canDelete ? 'hsl(0 84.2% 60.2%)' : undefined
                        }}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={!canDelete || isDeleting}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : `Delete ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default BulkDeleteModal

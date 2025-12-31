import { useState } from 'react'
import { filesApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

function DeleteModal({ file, onClose, onDeleted }) {
    const [confirmText, setConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState(null)

    const canDelete = confirmText === file.name

    const handleDelete = async () => {
        if (!canDelete) return

        setDeleting(true)
        setError(null)

        try {
            await filesApi.delete(file.path, file.name)
            onDeleted()
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed')
            setDeleting(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete {file.is_dir ? 'Directory' : 'File'}
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. The {file.is_dir ? 'directory and all its contents' : 'file'} will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-sm">
                        To confirm, type <strong className="text-destructive">{file.name}</strong> below:
                    </p>
                    <Input
                        placeholder="Type filename to confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        autoFocus
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!canDelete || deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteModal

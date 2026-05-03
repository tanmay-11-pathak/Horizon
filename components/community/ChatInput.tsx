import { ChangeEvent, RefObject } from 'react'

type ChatInputProps = {
  communityName: string
  userId: string | null
  input: string
  setInput: (value: string) => void
  posting: boolean
  uploadingMedia: boolean
  mediaFile: File | null
  mediaPreview: string | null
  setMediaFile: (file: File | null) => void
  setMediaPreview: (preview: string | null) => void
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}

export default function ChatInput({
  communityName,
  userId,
  input,
  setInput,
  posting,
  uploadingMedia,
  mediaFile,
  mediaPreview,
  setMediaFile,
  setMediaPreview,
  fileInputRef,
  onFileSelect,
  onSubmit,
}: ChatInputProps) {
  const disabled = posting || uploadingMedia || (!input.trim() && !mediaFile && !!userId)

  return (
    <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/95 to-transparent px-3 pb-6 pt-4 md:px-8 md:pb-8">
      <div className="mx-auto w-full max-w-5xl">
        {mediaPreview && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-[#121216]/90 p-3">
            <div className="relative inline-block">
              <img src={mediaPreview} alt="preview" className="h-20 max-w-[140px] rounded-lg object-cover" />
              <button
                onClick={() => {
                  setMediaFile(null)
                  setMediaPreview(null)
                }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
              >
                x
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121216] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-colors focus-within:border-[rgba(100,180,255,0.3)] md:gap-3 md:p-3">
          <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden" onChange={onFileSelect} />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md p-2 text-[#8e8e93] transition-all hover:bg-white/5 hover:text-[#f2f2f7]"
            title="Attach file"
            aria-label="Attach file"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder={userId ? `Message #${communityName.toLowerCase().replace(/\s+/g, '-')}...` : 'Sign up to chat in this community...'}
            disabled={!userId}
            className="flex-1 bg-transparent px-1 py-2 text-sm text-[#f2f2f7] outline-none placeholder:text-[#4a4a4f] md:text-[0.95rem]"
          />

          <button
            onClick={userId ? onSubmit : () => (window.location.href = '/sign-up')}
            disabled={disabled}
            className="rounded-lg bg-[#3a86ff] px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[#4a90ff] hover:shadow-[0_0_20px_rgba(64,150,255,0.5)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {posting || uploadingMedia ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}




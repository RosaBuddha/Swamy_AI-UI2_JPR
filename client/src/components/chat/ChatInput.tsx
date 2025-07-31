import React, { useState, useRef, ChangeEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Enter your message",
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px'; // Base height for single line
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '36px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="bg-white py-4">
        <div
          className="relative z-10 w-full bg-white rounded-[28px] text-black text-base leading-6 shadow-lg border border-white min-h-[56px] flex items-end pl-6 pr-[10px] py-2.5 font-inter"
          style={{
            boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 4px 0px, rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.04) 0px 10px 20px 0px"
          }}
        >
          <div className="relative w-full flex items-end">
            <div className="flex justify-center items-end px-0 gap-2 flex-[1_0_0]">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="w-full text-[14px] font-medium leading-6 bg-transparent outline-none resize-none py-0 pl-0 pr-2 placeholder-grey600 text-black min-h-[36px] font-inter disabled:opacity-50"
                aria-label="Message input"
                style={{
                  height: '36px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                }}
              />
            </div>
            <div className="flex items-end shrink-0">
              <button
                type="button"
                className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Voice input"
                disabled={disabled}
              >
                <MicrophoneIcon />
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                className="ml-3 h-9 w-9 flex items-center justify-center bg-[#222C2E] rounded-full shadow-sm hover:bg-[#2b3739] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ color: '#ffffff' }}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p style={{ color: 'var(--grey-800)', fontSize: '10px' }}>
            AI can make mistakes. Verify answers if in doubt.
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
.font-inter {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}

.font-inter textarea {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
`,
        }}
      />
    </>
  );
};

const MicrophoneIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <mask
      id="mask0_228_256"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="20"
      height="20"
    >
      <rect width="20" height="20" fill="#D9D9D9" />
    </mask>
    <g mask="url(#mask0_228_256)">
      <path
        d="M9.99996 11.6667C9.30552 11.6667 8.71524 11.4236 8.22913 10.9375C7.74302 10.4514 7.49996 9.86111 7.49996 9.16666V4.16666C7.49996 3.47222 7.74302 2.88194 8.22913 2.39583C8.71524 1.90972 9.30552 1.66666 9.99996 1.66666C10.6944 1.66666 11.2847 1.90972 11.7708 2.39583C12.2569 2.88194 12.5 3.47222 12.5 4.16666V9.16666C12.5 9.86111 12.2569 10.4514 11.7708 10.9375C11.2847 11.4236 10.6944 11.6667 9.99996 11.6667ZM9.16663 17.5V14.9375C7.72218 14.7431 6.52774 14.0972 5.58329 13C4.63885 11.9028 4.16663 10.625 4.16663 9.16666H5.83329C5.83329 10.3194 6.23954 11.3021 7.05204 12.1146C7.86454 12.9271 8.84718 13.3333 9.99996 13.3333C11.1527 13.3333 12.1354 12.9271 12.9479 12.1146C13.7604 11.3021 14.1666 10.3194 14.1666 9.16666H15.8333C15.8333 10.625 15.3611 11.9028 14.4166 13C13.4722 14.0972 12.2777 14.7431 10.8333 14.9375V17.5H9.16663ZM9.99996 10C10.2361 10 10.434 9.92014 10.5937 9.76041C10.7534 9.60069 10.8333 9.40277 10.8333 9.16666V4.16666C10.8333 3.93055 10.7534 3.73264 10.5937 3.57291C10.434 3.41319 10.2361 3.33333 9.99996 3.33333C9.76385 3.33333 9.56593 3.41319 9.40621 3.57291C9.24649 3.73264 9.16663 3.93055 9.16663 4.16666V9.16666C9.16663 9.40277 9.24649 9.60069 9.40621 9.76041C9.56593 9.92014 9.76385 10 9.99996 10Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="m4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z"
    />
  </svg>
);
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showCloseButton?: boolean;
}

export default function Modal({ 
  open, 
  onClose, 
  title, 
  children, 
  actions,
  showCloseButton = true 
}: ModalProps) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50"
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-50/80 dark:bg-[#09090b]/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center sm:items-center p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="fixed z-50 w-full left-0 right-0 bottom-0 mx-auto sm:relative sm:left-auto sm:right-auto sm:bottom-auto rounded-t-[20px] sm:rounded-[12px] bg-neutral-50 dark:bg-[#09090b] sm:border dark:shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.36)] sm:shadow-[0_6px_32px_-12px_rgba(0,0,0,0.22)] sm:max-w-[540px] p-0 overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm">
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 hidden sm:flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                    <span className="sr-only">关闭</span>
                  </button>
                )}

                <div className="px-8 py-6 sm:py-8">
                  <div className="flex flex-col text-center sm:text-left">
                    {title && (
                      <Dialog.Title className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-4">
                        {title}
                      </Dialog.Title>
                    )}
                    <div className="text-base text-neutral-600 dark:text-neutral-400">
                      {children}
                    </div>
                  </div>
                </div>

                {actions && (
                  <div className="mt-auto border-t border-neutral-200 dark:border-neutral-700">
                    <div className="px-8 py-5 bg-neutral-50 dark:bg-neutral-800/50">
                      {actions}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 
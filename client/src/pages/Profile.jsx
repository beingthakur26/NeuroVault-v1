import { UserProfile } from '@clerk/clerk-react'

export default function Profile() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-full max-w-4xl px-4 flex justify-center">
        <UserProfile 
          appearance={{
            variables: {
              colorBackground: '#0a0a0a',
              colorText: 'white',
              colorPrimary: '#6366f1',
              colorInputBackground: '#111',
              colorInputText: 'white',
              colorWarning: '#ef4444',
              colorDanger: '#ef4444',
              colorSuccess: '#22c55e',
            },
            elements: {
              card: 'bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-2xl',
              navbar: 'border-r border-white/10',
              navbarButton: 'hover:bg-white/5 text-gray-300',
              headerTitle: 'text-white font-bold',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-white/5 border border-white/10 hover:bg-white/10 text-white',
              dividerLine: 'bg-white/10',
              dividerText: 'text-gray-500',
              formFieldLabel: 'text-gray-300',
              formFieldInput: 'bg-[#111] border border-white/10 focus:border-indigo-500 text-white flex',
              footerActionText: 'text-gray-400',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300'
            }
          }}
        />
      </div>
    </div>
  )
}

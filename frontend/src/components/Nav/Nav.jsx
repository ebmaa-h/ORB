import { Logout } from '../index'

export default function Nav() {
  return (
    <div className='flex w-full'>
      <nav className='flex w-full items-center justify-between p-2 border-b'>
       <img src="/ebmaa-orb-text.svg" alt="Logo" className="h-10 w-auto" />
        <Logout />
      </nav>
    </div>
  )
}

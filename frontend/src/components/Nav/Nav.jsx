import { Logout } from '../index'

export default function Nav() {
  return (
    <div className="w-[90%] fixed top-0 h-16 bg-white text-white flex items-center p-6 z-10">
      <nav className="flex justify-between w-full items-center">
        <img src="/ebmaa-orb-text.svg" alt="Logo" className="h-7 w-auto" />

        {/* Remove the 'absolute' positioning and set Logout button as 'fixed' */}
        <div className="absolute top-0 right-0 p-4">
          <Logout />
        </div>
      </nav>
    </div>
  )
}

import { Logout } from '../index'

export default function Nav() {
  return (
    <div className='flex w-full'>
      <nav className='flex w-full'>
        <p>ORB</p>
        <Logout />
      </nav>
    </div>
  )
}

import './loginbox.css'

export default function LoginBox() {
  const testing = (event) => {
    event.preventDefault();
    const username = event.target.username.value;
    alert(`Welcome, ${username}!`); 
  }

  return (
    <div className="flex justify-center items-center min-h-screen text-sm">
      <div className="min-w-[300px] min-h-[425px] bg-white flex flex-col justify-between items-center rounded-lg py-8">
        <img className='max-w-[190px] h-auto translate-x-[-15px]' src="/ebmaa-orb-logo.svg" alt="" />
        <form className="flex flex-col justify-center items-center gap-6" onSubmit={testing}>
          {/* <div className='flex flex-col text-center gap-6'> */}
            {/* <label htmlFor="username">Username</label> */}
            <input className='border-b border-gray-light focus:outline-none text-center' type="text" name="username" id="username" placeholder='Username' required />
            {/* <label className='pt-4' htmlFor="password">Password</label> */}
            <input className='border-b border-gray-light focus:outline-none text-center' type="password" name="password" id="password" placeholder='Password' required />
          {/* </div> */}
          <input className='w-auto border py-1 px-1 border-gray-light min-w-[100px] rounded-sm' type="submit" value="Log In" />
        </form>

      </div>
    </div>  
  );
}

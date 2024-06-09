import Image from 'next/image';

const Home = () => {
  
  return (
    <div>
      <nav className="bg-black fixed top-0 w-full flex md:flex-nowrap p-0 shadow-md">        
        <a
          className="col-span-3 md:col-span-2 ml-3"
          href="http://www.dappuniversity.com/bootcamp"
          target="_blank"
          rel="noopener noreferrer"
        >
          Dapp University
        </a>
      </nav>
      <div className="container mx-auto mt-5">
        <div className="flex">
          <main role="main" className="col-span-12 lg:col-span-12 flex justify-center text-center">
            <div className="content mx-auto mt-5">
              <a
                href="http://www.dappuniversity.com/bootcamp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className="h-40 pointer-events-none animate-spin"
                  src="/logo.png"
                  alt="Logo"
                  width={180}
                  height={180}
                />
              </a>
              <h1 className= "mt-5">Dapp University Starter Kit</h1>
              <p>
                Edit <code>src/frontend/components/App.js</code> and save to reload.
              </p>
              <a
                className="text-blue-500"
                href="http://www.dappuniversity.com/bootcamp"
                target="_blank"
                rel="noopener noreferrer"
              >
                LEARN BLOCKCHAIN <u><b>NOW! </b></u>
              </a>
            </div>
          </main>
        </div>
      </div>
      {/* <Component {...pageProps} /> */}
    </div>
  );
}

export default Home;
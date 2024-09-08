import { Loader2 } from 'lucide-react'

export default function Page() {
  return (
      <div className=" bg-gray-900 text-white flex flex-col justify-center items-center py-16 ">
        <main className="w-full max-w-2xl mx-auto p-4 text-center align-middle m-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 animate-fade-in-down">
            Exciting Things Are Coming Soon
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 animate-fade-in-up">
            We're working hard to bring you the ultimate betting experience. Stay tuned for our launch!
          </p>
          <div className="flex justify-center items-center space-x-4 animate-pulse">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin"/>
            <span className="text-lg font-semibold">Preparing for launch...</span>
          </div>
        </main>
      </div>
  )
}
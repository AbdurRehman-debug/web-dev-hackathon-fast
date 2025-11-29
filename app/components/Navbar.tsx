'use client';

import { 
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";




export default function Navbar() {
    const path = usePathname();
    console.log(path)

    return (
         <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo/Brand */}
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                    YourApp
                  </a>
                </div>

                {/* Navigation Links (Optional) */}
               { (path != '/onboarding')?
                 <div className="hidden md:flex items-center gap-8">
                  <a href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Features
                  </a>
                  <a href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Pricing
                  </a>
                  <a href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Docs
                  </a>
                </div>
                :''
                }

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="bg-[#6c47ff] hover:bg-[#5639cc] text-white rounded-lg font-medium text-sm sm:text-base px-5 py-2 transition-colors shadow-sm hover:shadow-md">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10"
                        }
                      }}
                    />
                  </SignedIn>
                </div>
              </div>
            </div>
          </nav>
    )
}
import './global.css';
import {Metadata} from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | WeatherFit",
    default: "WeatherFit",
  },
  description: "날씨에 맞는 옷차림을 추천받으세요"
}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
        <body className="w-full h-screen flex justify-center items-center">
          <div className="w-[393px] h-screen mx-auto bg-white">
            {children}
          </div>
        </body>
      </html>
)
}

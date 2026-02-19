import './global.css';
import {Metadata} from "next";
import AuthProvider from "../components/AuthProvider";
import LayoutWrapper from "../components/LayoutWrapper";

export const metadata: Metadata = {
  title: {
    template: "%s | WeatherFit",
    default: "WeatherFit",
  },
  description: "날씨에 맞는 옷차림을 추천받으세요",

}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
        <head>
          <link rel="icon" href="/Weather.png" sizes="any" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
          <meta property="og:title" content="WeatherFit" />
          <meta property="og:description" content="날씨 기반 옷차림 공유 플랫폼" />
          <meta property="og:image" content="https://weather-fit-nextjs.vercel.app/background/sunny.png" />
        </head>
        <body className="w-full h-screen flex justify-center items-center">
          <LayoutWrapper>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LayoutWrapper>
        </body>
      </html>
)
}

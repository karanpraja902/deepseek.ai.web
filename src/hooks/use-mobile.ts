import * as React from "react"

// Define breakpoints for different device types
const BREAKPOINTS = {
  mobile: 640,    // sm
  tablet: 768,    // md
  laptop: 1024,   // lg
  desktop: 1280,  // xl
  wide: 1536      // 2xl
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useResponsive() {
  const [screenSize, setScreenSize] = React.useState<{
    isMobile: boolean
    isTablet: boolean
    isLaptop: boolean
    isDesktop: boolean
    isWide: boolean
    width: number
  }>({
    isMobile: false,
    isTablet: false,
    isLaptop: false,
    isDesktop: false,
    isWide: false,
    width: 0
  })

  React.useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      setScreenSize({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isLaptop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.laptop,
        isDesktop: width >= BREAKPOINTS.laptop && width < BREAKPOINTS.desktop,
        isWide: width >= BREAKPOINTS.desktop,
        width
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return screenSize
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`)
    const onChange = () => {
      setIsTablet(window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.tablet)
    }
    mql.addEventListener("change", onChange)
    setIsTablet(window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.tablet)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.laptop}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.laptop)
    }
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= BREAKPOINTS.laptop)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDesktop
}

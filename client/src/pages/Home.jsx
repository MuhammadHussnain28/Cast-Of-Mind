import Hero from '../components/home/Hero'
import Services from '../components/home/Services'
import Testimonials from '../components/home/Testimonials'
import HowItWorks from '../components/home/HowItWorks'
import WhoWeHelp from '../components/home/WhoWeHelp'
import Comparison from '../components/home/Comparison'
import Faq from '../components/home/Faq'
import Hero1 from '../components/home/Hero1'
import Services1 from '../components/home/Services1'


export default function Home() {
  return (
    <>
      {/* <Hero /> */}
      <Hero1/>
      {/* <Services/> */}
      <Services1/>
      <Testimonials />
      <HowItWorks />
      <WhoWeHelp />
      <Comparison />
      <Faq />
    </>
  )
}

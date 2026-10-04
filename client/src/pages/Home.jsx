import Hero from '../components/home/Hero'
import Services from '../components/home/Services'
import Testimonials from '../components/home/Testimonials1'
import HowItWorks from '../components/home/HowItWorks'
import WhoWeHelp from '../components/home/WhoWeHelp'
import ComparisonModern from '../components/home/ComparisonModern'
import Faq from '../components/home/Faq'
import HeroModern from '../components/home/HeroModern'
import Services1 from '../components/home/Services1'


export default function Home() {
  return (
    <>
      <HeroModern />
      {/* <Services/> */}
      <Services1/>
      <Testimonials />
      <HowItWorks />
      <WhoWeHelp />
      <ComparisonModern />
      <Faq />
    </>
  )
}

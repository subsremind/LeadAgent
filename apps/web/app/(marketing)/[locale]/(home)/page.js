import { Hero } from "@marketing/home/components/Hero";
import { setRequestLocale } from "next-intl/server";
export default async function Home({ params, }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return (<>
			<Hero />
			{/* <Features />
        <PricingSection />
        <FaqSection />
        <Newsletter />*/}
		</>);
}

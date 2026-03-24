import { useParams } from "react-router";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import LeadFormPopup from "../../../components/LeadFormPopup";
import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

export const SERVICES = {
  "interior-painting": {
    name: "Interior Painting",
    tagline: "Transform Living Spaces",
    description: "premium finishes, color consultation, eco-friendly paints",
    heroImg: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1400&q=80",
    warranty: "2-year workmanship warranty",
    priceFrom: "$350/room",
    features: [
      "Low-VOC premium Sherwin-Williams & Benjamin Moore paints",
      "Thorough surface prep, priming & 2-coat application",
      "Furniture moving & floor protection included",
      "Complimentary colour consultation on all projects",
      "Wall, ceiling, trim, door & cabinet painting",
      "2-year workmanship warranty on all interior work",
    ],
    serviceTypes: [
      { title: "Wall & Ceiling Painting", desc: "Full rooms, hallways, and ceilings in any finish from matte to semi-gloss with even, lasting coverage." },
      { title: "Trim, Doors & Baseboards", desc: "Crisp, clean lines on all trim work including doors, crown moulding, baseboards, and window frames." },
      { title: "Cabinet Painting", desc: "Refresh kitchen or bathroom cabinets with a smooth, durable factory-style finish at a fraction of replacement cost." },
      { title: "Accent & Feature Walls", desc: "Bold accent walls, faux finishes, or textured effects that add character and visual interest to any room." },
    ],
  },
  "exterior-painting": {
    name: "Exterior Painting",
    tagline: "Weather Protection",
    description: "weather-resistant coatings, power washing, 5-year warranty",
    heroImg: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1400&q=80",
    warranty: "5-year weather warranty",
    priceFrom: "Custom quote",
    features: [
      "Professional power washing & surface prep before painting",
      "Weather-resistant elastomeric & acrylic coatings",
      "Siding, trim, fascia, soffit & deck painting",
      "5-year weather warranty on all exterior work",
      "Caulking, rot repair & minor wood replacement",
      "Fully licensed & insured exterior painting crews",
    ],
    serviceTypes: [
      { title: "Siding & Cladding", desc: "Vinyl, wood, stucco, and composite siding painted or stained with premium weather-resistant products." },
      { title: "Trim, Fascia & Soffit", desc: "Detailed trim painting that protects wood elements and gives your home a polished, finished look." },
      { title: "Deck & Fence Staining", desc: "Penetrating deck stains and solid colour finishes that protect against moisture, UV, and foot traffic." },
      { title: "Power Washing", desc: "High-pressure washing of all exterior surfaces before painting for maximum adhesion and a clean base." },
    ],
  },
  "commercial-painting": {
    name: "Commercial Painting",
    tagline: "Business Solutions",
    description: "flexible scheduling, large-scale projects, fast turnaround",
    heroImg: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80",
    warranty: "2-year commercial warranty",
    priceFrom: "Custom quote",
    features: [
      "Off-hours, weekend & overnight scheduling available",
      "Large multi-crew teams for fast project completion",
      "Low-odour paints suitable for occupied spaces",
      "Retail, office, warehouse & industrial painting",
      "Detailed project management & progress reporting",
      "WSIB-covered, fully insured commercial crews",
    ],
    serviceTypes: [
      { title: "Office & Retail Painting", desc: "Professional office and retail space painting with minimal disruption to your business operations." },
      { title: "Industrial & Warehouse", desc: "Large-scale industrial painting including epoxy floor coatings, machinery markings, and safety markings." },
      { title: "Restaurant & Hospitality", desc: "Quick-turnaround painting for restaurants, hotels, and hospitality venues between operating hours." },
      { title: "Strata & Condo Buildings", desc: "Common area, hallway, and parkade painting for strata corporations and condo property managers." },
    ],
  },
  "wallpaper-services": {
    name: "Wallpaper Services",
    tagline: "High-End Wallpaper Installation",
    description: "residential & commercial wallpaper installation and removal",
    heroImg: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1400&q=80",
    warranty: "1-year installation warranty",
    priceFrom: "$12/sq ft installed",
    features: [
      "Wallpaper installation & professional removal",
      "All wallpaper types: vinyl, fabric, grasscloth, peel-and-stick",
      "Pattern matching & seam alignment expertise",
      "Wall surface prep & sizing before installation",
      "Residential & commercial wallpaper projects",
      "Custom murals and feature wall wallpaper",
    ],
    serviceTypes: [
      { title: "Wallpaper Installation", desc: "Expert installation of any wallpaper type with precise pattern matching and invisible seams." },
      { title: "Wallpaper Removal", desc: "Safe, damage-free removal of old wallpaper and adhesive, leaving walls ready for painting or new wallpaper." },
      { title: "Feature Wall Murals", desc: "Custom wallpaper murals and panoramic feature walls for living rooms, offices, and commercial spaces." },
      { title: "Commercial Wallcovering", desc: "Contract-grade wallcovering installation for hotels, offices, restaurants, and retail spaces." },
    ],
  },
  "specialty-finishes": {
    name: "Specialty Finishes",
    tagline: "Custom Artistry",
    description: "faux finishes, Venetian plaster, decorative painting",
    heroImg: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80",
    warranty: "1-year artisan warranty",
    priceFrom: "$8/sq ft",
    features: [
      "Venetian plaster & lime wash wall finishes",
      "Faux wood, stone, marble & metal effects",
      "Metallic, pearl & iridescent paint finishes",
      "Decorative stenciling & pattern painting",
      "Ombre, colour-wash & glazing techniques",
      "Fully custom artisan finishes unique to your space",
    ],
    serviceTypes: [
      { title: "Venetian Plaster", desc: "Authentic Italian Venetian plaster applied in multiple layers for a luxurious, polished marble-like finish." },
      { title: "Faux Finishes", desc: "Realistic faux wood grain, stone, marble, and brick effects using advanced glazing and painting techniques." },
      { title: "Metallic & Textured Paint", desc: "Gold, silver, copper, and custom metallic finishes for feature walls, ceilings, and accent surfaces." },
      { title: "Decorative Stenciling", desc: "Custom stenciled patterns, borders, and designs for walls, floors, and furniture." },
    ],
  },
};

export const CITIES = {
  // GTA
  toronto: {
    name: "Toronto",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Toronto's diverse housing stock — from Victorian rowhouses in Cabbagetown to glass condos in the Entertainment District — demands skilled painters who understand every surface and style. As Ontario's largest city, Toronto homeowners and property managers expect professional results on tight timelines and high-value properties. The city's humid summers and cold winters put exterior surfaces under significant seasonal stress, making quality paint and proper application essential for long-term protection.",
    neighborhoods: ["Liberty Village", "Leslieville", "The Beaches", "High Park", "Cabbagetown", "Rosedale", "Forest Hill", "North York", "Etobicoke", "Scarborough"],
    landmarks: ["CN Tower", "High Park", "Distillery District", "The Beaches boardwalk"],
    testimonial: { name: "David M.", area: "Leslieville", text: "Arcan transformed our 1920s semi-detached completely. They matched the heritage trim colours perfectly and finished ahead of schedule. Incredible work." },
    housingNotes: "Victorian semis, post-war bungalows, modern condos, and everything in between",
    challenge: "Toronto's climate swings between humid summers and harsh winters, demanding premium coatings that expand and contract without cracking.",
    population: "2.9 million",
  },
  mississauga: {
    name: "Mississauga",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Mississauga is one of Canada's fastest-growing cities, with established neighbourhoods in Port Credit and Streetsville alongside newer executive homes in Erin Mills and Meadowvale. The city's diverse population — including many South Asian and Middle Eastern communities — means we frequently work with homeowners who value both rich colour palettes and meticulous attention to detail. Properties near Lake Ontario face additional moisture challenges that demand weather-resistant exterior coatings.",
    neighborhoods: ["Port Credit", "Streetsville", "Erin Mills", "Meadowvale", "City Centre", "Clarkson", "Lakeview", "Cooksville"],
    landmarks: ["Port Credit Marina", "Square One", "Mississauga Civic Centre", "Credit River"],
    testimonial: { name: "Priya S.", area: "Erin Mills", text: "Professional, on time, and the colour consultation was exactly what we needed. Our home looks brand new. We've already recommended Arcan to three neighbours." },
    housingNotes: "Executive new builds, waterfront properties, and mature suburban homes",
    challenge: "Proximity to Lake Ontario creates higher humidity and salt air near the waterfront, requiring moisture-resistant primer and coatings.",
    population: "720,000",
  },
  brampton: {
    name: "Brampton",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Brampton is one of the fastest-growing cities in Canada, with a predominantly South Asian community that brings vibrant colour preferences and high expectations for craftsmanship. The city is home to thousands of detached homes built between the 1980s and today, many due for their first or second repaint. Brampton's continental climate — hot summers and cold winters — makes exterior paint durability essential for protecting property investments.",
    neighborhoods: ["Bramalea", "Heart Lake", "Castlemore", "Springdale", "Mount Pleasant", "Sandalwood", "Fletchers Creek", "Downtown Brampton"],
    landmarks: ["Gage Park", "Rose Theatre", "Heart Lake Conservation Area", "Brampton Farmers' Market"],
    testimonial: { name: "Harpreet B.", area: "Springdale", text: "Arcan Painting did an outstanding job on our two-storey home. They were respectful, tidy, and the finish is flawless. Highly recommend to all Brampton families." },
    housingNotes: "Large 2-storey detached homes and townhouses in planned suburban communities",
    challenge: "Brampton's rapid growth means many homes are entering their first major repaint cycle simultaneously — book early for best availability.",
    population: "660,000",
  },
  oakville: {
    name: "Oakville",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Oakville is one of Ontario's most affluent communities, where Heritage Old Oakville properties sit alongside modern executive estates in Joshua Creek and River Oaks. Homeowners here expect premium craftsmanship, premium materials, and a detail-oriented approach that matches the quality of their properties. Exterior painting near Lake Ontario requires top-tier weather-resistant coatings to handle lake-effect humidity and freeze-thaw cycles.",
    neighborhoods: ["Old Oakville", "Joshua Creek", "River Oaks", "Bronte", "Iroquois Ridge", "Glen Abbey", "Palermo", "Kerr Village"],
    landmarks: ["Oakville Harbour", "Glen Abbey Golf Club", "Sixteen Mile Creek", "Oakville Museum"],
    testimonial: { name: "Jennifer A.", area: "Old Oakville", text: "We hired Arcan to repaint our 1890s heritage home. Their knowledge of heritage-appropriate colours and techniques was impressive. Absolutely beautiful result." },
    housingNotes: "Heritage Victorian homes, lakefront estates, and upscale executive new builds",
    challenge: "Heritage properties in Old Oakville require heritage-appropriate colours and application techniques that preserve architectural details.",
    population: "235,000",
  },
  burlington: {
    name: "Burlington",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Burlington blends small-town charm with suburban growth, from the waterfront neighbourhoods of Aldershot and the downtown core to the newer communities of Orchard and Millcroft. The city's position between Hamilton and Oakville means homeowners have discerning taste, competitive property values, and high expectations for workmanship. Burlington's lakefront location introduces seasonal moisture and humidity that makes premium exterior coatings essential.",
    neighborhoods: ["Aldershot", "Orchard", "Millcroft", "Tyandaga", "Brant Hills", "Downtown Burlington", "Roseland", "Palmer"],
    landmarks: ["Burlington Pier", "Royal Botanical Gardens", "Spencer Smith Park", "Bronte Creek Provincial Park"],
    testimonial: { name: "Mark T.", area: "Aldershot", text: "Excellent communication, clean workspace, and a beautiful finished product. Arcan painted our entire home interior — every room looks professionally done." },
    housingNotes: "Waterfront properties, executive subdivisions, and well-maintained post-war homes",
    challenge: "Burlington's proximity to both Lake Ontario and the Niagara Escarpment creates microclimates that demand durable, flexible coatings.",
    population: "190,000",
  },
  milton: {
    name: "Milton",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Milton is one of the fastest-growing municipalities in Canada, with thousands of new-construction homes being built annually in communities like Hawthorne Village and Beaty. Young families buying new builds are increasingly investing in upgraded paint packages, feature walls, and premium interior finishes to personalize their homes. Milton's location at the edge of the Niagara Escarpment means dramatic weather patterns that require durable exterior coatings.",
    neighborhoods: ["Hawthorne Village", "Beaty", "Clarke", "Coates", "Trafalgar", "Scott", "Old Milton", "Dempsey"],
    landmarks: ["Rattlesnake Point Conservation Area", "Milton Fairgrounds", "Kelso Conservation Area", "Niagara Escarpment"],
    testimonial: { name: "Sarah K.", area: "Hawthorne Village", text: "As a new homeowner in Milton, I wanted to personalize our space. Arcan's colour consultation and feature wall work was exactly what I envisioned. Love it!" },
    housingNotes: "New-construction detached homes and townhouses in planned communities",
    challenge: "Milton's dramatic growth means tight contractor schedules — Arcan prioritizes Milton projects with dedicated crews.",
    population: "150,000",
  },
  pickering: {
    name: "Pickering",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Pickering combines established waterfront communities along Lake Ontario with rapidly growing suburban neighbourhoods like Seaton to the north. The city's mix of mature homes in Bay Ridges and Dunbarton alongside newer builds gives our teams experience with every era of construction. Lakefront properties in Pickering face the same moisture and salt challenges as other Lake Ontario communities, requiring premium exterior protection.",
    neighborhoods: ["Bay Ridges", "Dunbarton", "Seaton", "Liverpool", "Brock Ridge", "Rougemount", "Amberlea", "Woodlands"],
    landmarks: ["Pickering Town Centre", "Rouge National Urban Park", "Petticoat Creek Conservation Area", "Pickering Waterfront Trail"],
    testimonial: { name: "Carlos M.", area: "Bay Ridges", text: "Arcan repainted our entire home exterior and the results are stunning. The crew was professional and the 5-year warranty gives us complete peace of mind." },
    housingNotes: "Waterfront bungalows, post-war semis, and new Seaton subdivision homes",
    challenge: "The range from 1950s waterfront bungalows to brand-new Seaton builds means crews must adapt techniques for very different surface conditions.",
    population: "100,000",
  },
  ajax: {
    name: "Ajax",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Ajax is a rapidly growing lakeside community on Durham Region's western edge, attracting young professionals and families who take pride in their homes. The city's waterfront trail, Ajax Harbour, and vibrant downtown are surrounded by residential neighbourhoods where curb appeal matters. Ajax's proximity to Lake Ontario introduces humidity and moisture concerns that make proper surface preparation and primer application critical for lasting exterior paint jobs.",
    neighborhoods: ["South Ajax", "Westney Heights", "Central Ajax", "Northeast Ajax", "Pickering Village", "Riverside", "Shoal Point", "Duffin Heights"],
    landmarks: ["Ajax Waterfront Park", "Ajax Harbour", "Duffins Creek", "Ajax Community Centre"],
    testimonial: { name: "Aisha R.", area: "Westney Heights", text: "We're so happy with Arcan's work. The interior painting was clean, fast, and the crew was incredibly respectful of our home. 10/10 recommend." },
    housingNotes: "Mid-century bungalows, 1990s–2000s semis, and newer executive townhouses",
    challenge: "Ajax homes near the lake require extra attention to moisture barriers and primer before exterior painting to prevent premature peeling.",
    population: "135,000",
  },
  whitby: {
    name: "Whitby",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Whitby is one of Durham Region's most desirable communities, with waterfront parkland, historic downtown charm, and upscale subdivisions like Pringle Creek and Brooklin attracting homeowners who invest in their properties. The historic downtown area features century-old commercial buildings and Victorian homes that benefit from specialty painting expertise. Whitby's lakefront position introduces seasonal weather extremes that demand premium exterior coating systems.",
    neighborhoods: ["Brooklin", "Pringle Creek", "Whitby Shores", "Port Whitby", "Downtown Whitby", "Rolling Acres", "Lynde Creek", "Blue Grass Meadows"],
    landmarks: ["Iroquois Beach", "Whitby Harbour", "Henry Street Historic District", "Whitby Courthouse"],
    testimonial: { name: "Paul & Sandra D.", area: "Brooklin", text: "Arcan painted both interior and exterior of our Brooklin home. Two separate crews, coordinated perfectly. Couldn't be happier with the quality and value." },
    housingNotes: "Heritage downtown properties, lakeside communities, and modern suburban neighbourhoods",
    challenge: "Whitby's heritage district homes require knowledge of period-appropriate colours and surfaces, including older plaster and wood siding.",
    population: "140,000",
  },
  oshawa: {
    name: "Oshawa",
    region: "Greater Toronto Area",
    province: "Ontario",
    intro: "Oshawa is Durham Region's largest city, with a proud industrial heritage and a rapidly evolving residential landscape driven by university growth and urban renewal. Donevan, McLaughlin, and the O'Neill area offer diverse housing types at accessible price points, while newer developments in Kedron and Taunton attract growing families. Oshawa's position well inland from the lake means colder winters and more pronounced freeze-thaw cycles that test exterior paint durability.",
    neighborhoods: ["Donevan", "McLaughlin", "O'Neill", "Kedron", "Taunton", "Vanier", "Lakeview", "Centennial"],
    landmarks: ["Canadian Automotive Museum", "Lakeview Park", "Durham College", "Ontario Tech University"],
    testimonial: { name: "Michelle C.", area: "McLaughlin", text: "Affordable, professional, and excellent quality. Arcan helped us choose colours that worked with our 1970s home and the transformation is remarkable." },
    housingNotes: "Post-war bungalows, 1960s–80s semis, and newer north-end subdivision homes",
    challenge: "Oshawa's colder winters mean exterior painting must be scheduled carefully — Arcan monitors weather to ensure ideal painting conditions.",
    population: "175,000",
  },
  // York Region
  newmarket: {
    name: "Newmarket",
    region: "York Region",
    province: "Ontario",
    intro: "Newmarket is one of York Region's most established communities, with a thriving Main Street heritage corridor and well-maintained residential neighbourhoods that have attracted families for generations. The town's blend of historic Victorian homes, 1980s–90s subdivisions, and newer townhouse developments means Arcan's teams work across the full spectrum of residential painting needs. York Region's cold winters and hot humid summers create freeze-thaw cycles that demand elastomeric exterior coatings for maximum durability.",
    neighborhoods: ["Main Street Heritage District", "Huron Heights", "Summerhill Estates", "Bristol-London", "Stonehaven", "Glenway", "Central Newmarket"],
    landmarks: ["Main Street Newmarket", "Fairy Lake", "Southlake Health", "Newmarket Town Square"],
    testimonial: { name: "Kevin L.", area: "Huron Heights", text: "Arcan painted our entire exterior before the winter. The power washing, prep, and two-coat application are outstanding. Our home looks 15 years younger." },
    housingNotes: "Heritage Main Street storefronts, 1980s executive homes, and newer townhouse communities",
    challenge: "Newmarket's heritage district requires expertise with older wood siding and century-old masonry surfaces that need careful prep.",
    population: "90,000",
  },
  aurora: {
    name: "Aurora",
    region: "York Region",
    province: "Ontario",
    intro: "Aurora is a prestigious York Region community known for its tree-lined streets, outstanding schools, and a strong sense of civic pride that keeps neighbourhood aesthetics high. Heritage Old Aurora features Victorian-era homes and commercial buildings that require expert colour selection and surface preparation, while newer communities like Bayview Wellington and Aurora Highlands attract affluent families who invest in premium home finishes. Aurora homeowners consistently seek high-quality workmanship that matches the community's elevated standards.",
    neighborhoods: ["Old Aurora", "Bayview Wellington", "Aurora Highlands", "Aurora Grove", "Temperance Street", "Leslie Valley", "Bloomington Downs"],
    landmarks: ["Aurora Cultural Centre", "Hillary House", "Aurora Community Arboretum", "Aurora Town Park"],
    testimonial: { name: "Lisa B.", area: "Old Aurora", text: "We restored our 1880s home's exterior with Arcan's help. Their knowledge of period colours and heritage application methods was exactly what we needed." },
    housingNotes: "Heritage Victorian homes, executive estates, and upscale family subdivisions",
    challenge: "Aurora's prestigious real estate means clients expect impeccable detail work, colour consultation expertise, and crews that treat homes with extra care.",
    population: "70,000",
  },
  "richmond-hill": {
    name: "Richmond Hill",
    region: "York Region",
    province: "Ontario",
    intro: "Richmond Hill is one of York Region's largest and most diverse cities, home to a large Chinese-Canadian community alongside established North American families in Mill Pond and Bayview neighbourhoods. The city has some of York Region's highest property values, driving demand for premium painting services that protect and enhance real estate investments. Richmond Hill's mix of mature 1970s–90s homes and newer executive builds means our teams must be skilled across every era of construction.",
    neighborhoods: ["Mill Pond", "Bayview Hill", "Oak Ridges", "Jefferson", "Langstaff", "Yonge & Major Mackenzie", "Westbrook", "Rouge Woods"],
    landmarks: ["Mill Pond Park", "David Dunlap Observatory", "Richmond Hill Centre", "Richmond Green Sports Centre"],
    testimonial: { name: "Wei C.", area: "Bayview Hill", text: "We wanted a complete interior refresh for our home. Arcan provided bilingual service, a beautiful colour plan, and flawless execution. Highly recommended." },
    housingNotes: "1980s–90s executive homes, luxury new builds, and densely built townhouse communities",
    challenge: "Richmond Hill's diverse homeowner base includes many clients from cultural backgrounds with specific colour preferences — Arcan's consultants are experienced with a wide range of palettes.",
    population: "210,000",
  },
  markham: {
    name: "Markham",
    region: "York Region",
    province: "Ontario",
    intro: "Markham is Canada's high-tech capital, home to the largest Chinese-Canadian community outside Vancouver and a rapidly growing population of professionals and entrepreneurs who take pride in their properties. Communities like Unionville, Cornell, and Angus Glen represent some of York Region's most desirable addresses. Unionville's heritage main street features Victorian commercial buildings that demand the same painting expertise as Markham's newest luxury developments.",
    neighborhoods: ["Unionville", "Cornell", "Angus Glen", "Thornhill", "Cathedraltown", "Milliken Mills", "Greensborough", "Box Grove"],
    landmarks: ["Historic Unionville Main Street", "Toogood Pond", "Angus Glen Golf Club", "Markham Civic Centre"],
    testimonial: { name: "Jason T.", area: "Cornell", text: "Arcan did a superb job on our Cornell home. Precise taping, clean lines, and the Venetian plaster feature wall they created in our foyer is a showstopper." },
    housingNotes: "Heritage Unionville properties, upscale detached homes, and large-format new builds",
    challenge: "Markham's diverse, design-savvy clientele expects both colour expertise and technical perfection — Arcan's painters regularly work on Markham's premium properties.",
    population: "365,000",
  },
  vaughan: {
    name: "Vaughan",
    region: "York Region",
    province: "Ontario",
    intro: "Vaughan is York Region's fastest-growing city and one of Canada's most dynamic real estate markets, with luxury communities in Woodbridge, Kleinburg, and Maple attracting Italian-Canadian and other affluent families who expect impeccable craftsmanship. Kleinburg's heritage village and Woodbridge's established Italian community bring strong traditions of pride in home appearance. Vaughan's newer Maple and Concord communities feature massive detached homes with significant exterior painting requirements.",
    neighborhoods: ["Woodbridge", "Kleinburg", "Maple", "Concord", "Thornhill", "Patterson", "Vellore Village", "Islington Woods"],
    landmarks: ["McMichael Canadian Art Collection", "Vaughan Mills", "Canada's Wonderland", "Kleinburg Heritage Village"],
    testimonial: { name: "Rosa M.", area: "Woodbridge", text: "Excellence from start to finish. The Arcan team painted our entire home — they understood exactly the quality Woodbridge homeowners expect. Magnifico!" },
    housingNotes: "Large luxury detached homes, heritage village properties, and upscale townhouse communities",
    challenge: "Vaughan's large luxury homes often have complex rooflines and architectural details that require skilled exterior painters with heights experience.",
    population: "340,000",
  },
  "king-city": {
    name: "King City",
    region: "York Region",
    province: "Ontario",
    intro: "King City is one of Ontario's most exclusive rural-residential communities, home to expansive estate properties, equestrian farms, and luxury country homes set among rolling hills north of Toronto. Homeowners here demand the highest level of craftsmanship and discretion — exterior painting projects may cover thousands of square feet of siding, rail fencing, and outbuildings. King City's rural setting means exposure to the elements is more severe, demanding premium coating systems that withstand freeze-thaw cycles and wind-driven precipitation.",
    neighborhoods: ["King City Village", "Nobleton", "Schomberg", "Pottageville", "Kettleby", "Bond Head"],
    landmarks: ["King Township Heritage Park", "National Equestrian Park Site", "King City Conservation Area", "Schomberg Village"],
    testimonial: { name: "William F.", area: "King City Village", text: "Our estate required 3 weeks of exterior painting work. Arcan managed the entire project with the professionalism you'd expect for a property at this level. Excellent." },
    housingNotes: "Estate homes, equestrian properties, heritage farmhouses, and luxury country retreats",
    challenge: "King City's large estate properties require multi-week project management, scaffold systems, and crews experienced with rural property logistics.",
    population: "30,000",
  },
  stouffville: {
    name: "Stouffville",
    region: "York Region",
    province: "Ontario",
    intro: "Stouffville — officially Whitchurch-Stouffville — is a charming small town experiencing rapid suburban growth, with historic Main Street buildings being joined by large new residential communities. Young families are drawn to Stouffville for its small-town character, excellent schools, and proximity to Toronto, creating strong demand for move-in-ready painted interiors and well-maintained exteriors. The town's heritage main street features a mix of 19th-century brick buildings that benefit from specialty exterior painting expertise.",
    neighborhoods: ["Stouffville Village", "Ballantrae", "Musselman's Lake", "Cedar Grove", "Millard Crossing", "Porritt Estates"],
    landmarks: ["Main Street Stouffville", "Whitchurch Conservation Area", "Stouffville Community Centre", "York-Durham Heritage Railway"],
    testimonial: { name: "Tom & Claire H.", area: "Stouffville Village", text: "Arcan painted our heritage brick home with respect for the original architecture. The colour matching and brick painting expertise was exactly what we were looking for." },
    housingNotes: "Heritage village homes, new subdivision builds, and rural acreage properties",
    challenge: "Stouffville's heritage homes require paint products and colours appropriate for 19th-century brick and wood construction.",
    population: "50,000",
  },
  georgina: {
    name: "Georgina",
    region: "York Region",
    province: "Ontario",
    intro: "Georgina sits on the southern shore of Lake Simcoe, one of Ontario's premier recreational lakes, making it a popular destination for both year-round residents and cottage owners. Communities like Keswick, Sutton, and Jackson's Point cater to everything from modest waterfront bungalows to luxury lakeside retreats. Cottage and waterfront properties face severe UV exposure, moisture, and ice damage, demanding premium exterior stain and paint systems with multi-year warranties.",
    neighborhoods: ["Keswick", "Sutton", "Jackson's Point", "Pefferlaw", "Virginia", "Baldwin", "Roches Point"],
    landmarks: ["Lake Simcoe waterfront", "Georgina Island", "Jackson's Point Heritage Harbour", "Sibbald Provincial Park"],
    testimonial: { name: "Nancy W.", area: "Keswick", text: "Arcan painted our Lake Simcoe cottage and the results are beautiful. They understood the waterfront environment and recommended the right products for moisture resistance." },
    housingNotes: "Waterfront cottages, year-round lakeside homes, and rural residential properties",
    challenge: "Lake Simcoe's waterfront humidity, UV exposure, and ice buildup demand specialized marine-grade exterior coatings for cottage and lakeside properties.",
    population: "50,000",
  },
  "east-gwillimbury": {
    name: "East Gwillimbury",
    region: "York Region",
    province: "Ontario",
    intro: "East Gwillimbury is one of York Region's most rapidly growing municipalities, with the Sharon Village and Holland Landing communities swelling with new-construction homes as families move north from the GTA. The town's historic Holland Landing district features century-old heritage buildings alongside brand-new detached homes, giving Arcan's teams experience across every building era. East Gwillimbury's rural-suburban character means many properties include garages, workshops, and outbuildings that also benefit from professional painting.",
    neighborhoods: ["Sharon Village", "Holland Landing", "Mount Albert", "Queensville", "Green Lane", "Anchor Park"],
    landmarks: ["Sharon Temple", "Holland River", "Rogers Reservoir Conservation Area", "Mount Albert Heritage District"],
    testimonial: { name: "Steve N.", area: "Sharon Village", text: "Brand new home, wanted it personalized right away. Arcan's interior team came in immediately after possession and the colour consultation was incredibly helpful." },
    housingNotes: "New-construction detached homes, heritage village properties, and rural acreage",
    challenge: "East Gwillimbury's rapid growth means many clients are first-time homeowners — Arcan provides extra guidance on colour selection and maintenance planning.",
    population: "45,000",
  },
  // Simcoe County
  barrie: {
    name: "Barrie",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Barrie is the urban heart of Simcoe County, a city of over 160,000 sitting on Kempenfelt Bay of Lake Simcoe and serving as the gateway to cottage country. The city's rapid growth has brought tens of thousands of new residents from the GTA, fuelling demand for painting services across both new construction and existing homes. Barrie's proximity to Georgian Bay and Lake Simcoe means its climate is highly variable — harsh winters, humid summers, and everything in between — making premium exterior coating systems essential.",
    neighborhoods: ["Downtown Barrie", "Allandale", "Holly", "Ardagh Bluffs", "Sunnidale", "Bayshore", "Painswick", "Georgian Drive"],
    landmarks: ["Kempenfelt Bay", "Barrie Waterfront", "Centennial Park", "Barrie City Hall"],
    testimonial: { name: "Diana P.", area: "Allandale", text: "Moving to Barrie from Toronto, we wanted our new home painted before moving in. Arcan was incredibly fast, professional, and the quality exceeded our expectations." },
    housingNotes: "Post-war bungalows, 1980s–90s subdivisions, and rapidly expanding new communities",
    challenge: "Barrie's severe winters and lake-effect snow demand the highest-grade exterior coatings and proper seasonal timing for exterior painting.",
    population: "165,000",
  },
  orillia: {
    name: "Orillia",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Orillia is a charming lakeside city sitting between Lake Simcoe and Lake Couchiching, drawing both permanent residents and seasonal visitors who appreciate its historic downtown and natural surroundings. The city's well-preserved heritage buildings on Mississaga Street are a source of community pride, and property owners invest in professional painting to maintain the downtown corridor's character. Orillia's waterfront location means exterior surfaces face humidity, freeze-thaw cycles, and UV exposure that demand premium protective coatings.",
    neighborhoods: ["Downtown Orillia", "Westside", "North Ward", "South Ward", "Couchiching Beach", "Coldwater Road", "Orillia Estates"],
    landmarks: ["Orillia Opera House", "Tudhope Park", "Lake Couchiching", "Stephen Leacock Museum"],
    testimonial: { name: "Bob & Pat G.", area: "Westside", text: "Arcan painted our 1940s Orillia home inside and out. They were sensitive to the older plaster walls and original wood trim. A real professional outfit." },
    housingNotes: "Heritage downtown commercial, mid-century lakeside homes, and newer residential developments",
    challenge: "Orillia's significant stock of pre-war homes requires expertise with older construction materials including plaster walls, lead-safe practices, and original woodwork.",
    population: "35,000",
  },
  innisfil: {
    name: "Innisfil",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Innisfil is one of Ontario's most rapidly growing municipalities, with communities like Friday Harbour, Alcona, and Stroud growing quickly as GTA residents seek more affordable lakeside living on Lake Simcoe. Friday Harbour Resort and its surrounding residential community represent a new generation of upscale lakeside properties where premium finishes are expected. Innisfil's waterfront and inland communities both face significant weather exposure that makes quality exterior painting a long-term investment.",
    neighborhoods: ["Alcona", "Friday Harbour", "Stroud", "Cookstown", "Lefroy", "Churchill", "Belle Ewart", "Big Bay Point"],
    landmarks: ["Friday Harbour Resort", "Lake Simcoe shoreline", "Alcona Beach", "Innisfil Beach Park"],
    testimonial: { name: "Kate M.", area: "Friday Harbour", text: "Our Friday Harbour condo needed a complete interior refresh. Arcan worked around the resort schedule perfectly and the result is stunning — pure luxury." },
    housingNotes: "Resort condos, waterfront cottages, new-construction suburban homes, and rural properties",
    challenge: "Innisfil's mix of resort properties, waterfront homes, and suburban builds requires crews experienced with diverse construction types and coating systems.",
    population: "42,000",
  },
  bradford: {
    name: "Bradford",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Bradford — formally Bradford West Gwillimbury — is a rapidly growing community at the southern edge of Simcoe County, attracting young families priced out of the GTA who bring high expectations for home quality and craftsmanship. The town's agricultural heritage is visible in its rural landscape, while newer residential communities are growing quickly around the historic downtown core. Bradford's location between York Region and Simcoe County means it benefits from proximity to both GTA contractors and cottage-country expertise.",
    neighborhoods: ["Downtown Bradford", "West Park", "Bond Head", "Schomberg", "Newton Robinson", "Hockley"],
    landmarks: ["Holland Marsh", "Bradford Town Hall", "Bradford District Memorial Park", "Scanlon Creek Conservation Area"],
    testimonial: { name: "Ryan & Amanda F.", area: "West Park", text: "Arcan painted our Bradford new build before we moved in. The colour advice was excellent and the workmanship is perfect. Great value for a young family." },
    housingNotes: "New-construction family homes, heritage downtown buildings, and agricultural properties",
    challenge: "Bradford's rapid growth means new construction is the primary market — Arcan specializes in new-build painting packages that include primer, colour consultation, and move-in-ready finishes.",
    population: "45,000",
  },
  alliston: {
    name: "Alliston",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Alliston is a thriving industrial and agricultural town best known as the home of Honda Canada's manufacturing plant, surrounded by some of Ontario's most productive farmland in Nottawasaga Township. The town's growing residential population includes both long-established agricultural families and new residents attracted by Honda employment and lower housing costs. Alliston's continental climate — colder and snowier than the GTA — demands particularly durable exterior coatings that withstand harsh winter conditions.",
    neighborhoods: ["Downtown Alliston", "Banting Heights", "Earl Heights", "Treetops", "Bond Head", "Beeton"],
    landmarks: ["Honda Canada Manufacturing", "Dr. Frederick Banting historic site", "Nottawasaga River", "Alliston Arena"],
    testimonial: { name: "Dave S.", area: "Banting Heights", text: "Arcan Painting came up to Alliston and did a first-class job on our home exterior. They were on time, professional, and the 5-year warranty is a real reassurance." },
    housingNotes: "Agricultural properties, post-war bungalows, and newer residential communities",
    challenge: "Alliston's colder winters require careful scheduling of exterior painting and premium elastomeric coatings that handle extreme temperature ranges.",
    population: "25,000",
  },
  collingwood: {
    name: "Collingwood",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Collingwood is Ontario's premier four-season resort destination, set at the base of Blue Mountain and on the shores of Georgian Bay. The town draws a mix of year-round residents, weekend cottagers, and seasonal visitors who invest in beautifully maintained properties. Collingwood's booming real estate market, driven by remote workers and retirees relocating from Toronto, has created strong demand for premium interior and exterior painting services for both primary residences and vacation properties.",
    neighborhoods: ["Downtown Collingwood", "Cranberry", "Mountaincroft", "Blue Fairways", "Georgian Manor", "Lighthouse Point"],
    landmarks: ["Blue Mountain Resort", "Georgian Bay shoreline", "Collingwood Terminals", "Scenic Caves Nature Adventures"],
    testimonial: { name: "Karen & Rob L.", area: "Cranberry", text: "We renovated our Collingwood chalet and Arcan painted every room with incredible quality. They understood the mountain aesthetic perfectly. Couldn't be happier." },
    housingNotes: "Ski chalets, waterfront cottages, resort condos, and executive year-round homes",
    challenge: "Collingwood's Georgian Bay exposure and mountain weather create demanding conditions for exterior surfaces — Arcan uses marine-grade coatings for maximum durability.",
    population: "25,000",
  },
  "wasaga-beach": {
    name: "Wasaga Beach",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Wasaga Beach is home to the world's longest freshwater beach and is one of Ontario's most popular recreational destinations. The town is undergoing a significant transformation as year-round residents and retirees invest in upgrading and modernizing older cottage properties along the Nottawasaga River and beach corridors. Wasaga Beach's proximity to water — both Georgian Bay and the Nottawasaga River — creates humidity and salt conditions that demand premium exterior coatings with excellent moisture resistance.",
    neighborhoods: ["Beach Areas 1-6", "Mosley Street District", "River Road", "Marlwood", "Twin Creeks", "New Wasaga"],
    landmarks: ["Wasaga Beach Provincial Park", "Georgian Bay shoreline", "Nottawasaga River", "Beach Drive strip"],
    testimonial: { name: "Frank & Debbie H.", area: "Beach Area 2", text: "Our beach cottage was badly weathered. Arcan's exterior team power-washed and repainted everything — it looks brand new and the warranty protects our investment." },
    housingNotes: "Waterfront cottages, older bungalows, newer year-round builds, and rental income properties",
    challenge: "Wasaga Beach properties face extreme moisture from Georgian Bay and the Nottawasaga River — proper waterproof primer and marine-grade coatings are essential.",
    population: "25,000",
  },
  midland: {
    name: "Midland",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Midland is a historic Georgian Bay community that has served as a hub for Simcoe County's northern communities for over a century. The town's well-preserved downtown, notable for its famous outdoor murals depicting local history, attracts tourists and residents who appreciate arts, culture, and community character. Midland's waterfront location on Georgian Bay means its housing stock faces significant weather challenges including lake-effect humidity, strong winds, and harsh winters that test exterior paint systems.",
    neighborhoods: ["Downtown Midland", "Port McNicoll", "Victoria Harbour", "Tay Shores", "Midland Bay Landing", "Little Lake"],
    landmarks: ["Midland Murals", "Discovery Harbour", "Wye Marsh Wildlife Centre", "Georgian Bay shoreline"],
    testimonial: { name: "Anne P.", area: "Downtown Midland", text: "Our downtown Midland commercial building needed a full exterior repaint. Arcan respected the heritage character while giving us a fresh, professional appearance." },
    housingNotes: "Heritage commercial buildings, waterfront properties, and residential homes in established neighbourhoods",
    challenge: "Midland's Georgian Bay exposure means exterior surfaces face some of Ontario's most demanding weather — Arcan specifies premium elastomeric coatings for all Midland projects.",
    population: "17,000",
  },
  penetanguishene: {
    name: "Penetanguishene",
    region: "Simcoe County",
    province: "Ontario",
    intro: "Penetanguishene — or 'Penetang' as locals call it — is a charming bilingual town on Georgian Bay with a deep French-Canadian heritage and a strong sense of community identity. The town's heritage waterfront, historic buildings, and proximity to Georgian Bay Islands National Park make it a sought-after destination for retirees and families looking for character and quality of life. Penetanguishene's bilingual character means Arcan's team is ready to communicate in both English and French to serve every homeowner.",
    neighborhoods: ["Downtown Penetanguishene", "Lafontaine", "Georgian Bay waterfront", "Fox Street corridor", "West end residential"],
    landmarks: ["Discovery Harbour", "Georgian Bay Islands", "Penetanguishene Town Dock", "St. Ann's Church heritage site"],
    testimonial: { name: "Michel B.", area: "Downtown Penetanguishene", text: "Service bilingue impeccable. Arcan a peint notre maison avec un soin exceptionnel et leur connaissance des couleurs patrimoniales était parfaite." },
    housingNotes: "Heritage French-Canadian homes, waterfront properties, and established residential neighbourhoods",
    challenge: "Penetanguishene's Georgian Bay climate, with freeze-thaw and lake-effect moisture, demands premium waterproof coatings and thorough surface preparation before every exterior project.",
    population: "9,000",
  },
};

// Service to slug mapping
export const SERVICE_SLUGS = {
  "interior-painting": "interior-painting",
  "exterior-painting": "exterior-painting",
  "commercial-painting": "commercial-painting",
  "wallpaper-services": "wallpaper-services",
  "specialty-finishes": "specialty-finishes",
};

export const CITY_SLUGS = Object.keys(CITIES);

// ─── Meta ───────────────────────────────────────────────────────────────────────

export function meta({ params }) {
  const service = SERVICES[params.service];
  const city = CITIES[params.city];
  if (!service || !city) return [{ title: "Page Not Found | Arcan Painting" }];

  const title = `${service.name} in ${city.name}, Ontario | Arcan Painting`;
  const description = `Professional ${service.name.toLowerCase()} services in ${city.name}, ${city.province}. ${service.tagline} — ${service.description}. ${service.warranty}. Free estimates for ${city.name} homeowners.`;
  const url = `https://arcanpainting.ca/${params.service}/${params.city}`;

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: `${service.name.toLowerCase()} ${city.name}, ${city.name} painters, painting ${city.name}, ${service.name.toLowerCase()} ${city.region}, arcan painting ${city.name}` },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Arcan Painting" },
    { property: "og:image", content: "https://arcanpainting.ca/og-image.png" },
    { tagName: "link", rel: "canonical", href: url },
  ];
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CityServicePage() {
  const { service: serviceSlug, city: citySlug } = useParams();
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

  const service = SERVICES[serviceSlug];
  const city = CITIES[citySlug];

  if (!service || !city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Page Not Found</h1>
          <a href="/" className="text-amber-500 hover:underline">← Back to Home</a>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://arcanpainting.ca/#business",
        name: "Arcan Painting",
        url: "https://arcanpainting.ca",
        image: "https://arcanpainting.ca/og-image.png",
        description: `Professional painting contractor serving ${city.name} and the ${city.region} since 1995.`,
        telephone: "+14167272148",
        email: "info@arcanpainting.ca",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Toronto",
          addressRegion: "ON",
          addressCountry: "CA",
        },
        areaServed: [city.name, city.region, "Ontario"],
        priceRange: "$$",
        openingHours: "Mo-Fr 07:00-18:00, Sa 08:00-16:00",
      },
      {
        "@type": "Service",
        name: `${service.name} in ${city.name}`,
        serviceType: service.name,
        provider: { "@id": "https://arcanpainting.ca/#business" },
        areaServed: city.name,
        description: `${service.tagline}: ${service.description}. Serving ${city.name} since 1995.`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How much does ${service.name.toLowerCase()} cost in ${city.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${service.name} in ${city.name} starts from ${service.priceFrom}. Exact pricing depends on the size and condition of your property. Contact Arcan Painting for a free, detailed estimate with no obligation.`,
            },
          },
          {
            "@type": "Question",
            name: `Why choose Arcan Painting for ${service.name.toLowerCase()} in ${city.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Arcan Painting has served ${city.name} since 1995 with professional ${service.name.toLowerCase()} services. We are fully licensed, insured, and backed by a ${service.warranty}. Our team understands ${city.name}'s local housing stock and climate conditions.`,
            },
          },
        ],
      },
    ],
  };

  const otherServices = Object.entries(SERVICES)
    .filter(([slug]) => slug !== serviceSlug)
    .slice(0, 4);

  const faqItems = [
    {
      q: `How much does ${service.name.toLowerCase()} cost in ${city.name}?`,
      a: `${service.name} pricing in ${city.name} starts from ${service.priceFrom}. Final cost depends on square footage, surface condition, number of coats, and materials chosen. Arcan Painting offers free, detailed written estimates for all ${city.name} projects with no obligation. Most ${city.name} homeowners find our pricing competitive with other local painters while offering superior quality and a ${service.warranty}.`,
    },
    {
      q: `How long does ${service.name.toLowerCase()} take in ${city.name}?`,
      a: `Project duration varies by scope. For ${city.name} residential projects, small ${service.name.toLowerCase()} jobs can be completed in 1-2 days, while larger projects may take 3-7 days. We work efficiently to minimize disruption and always provide a clear timeline before starting. ${city.name} commercial projects are scheduled around your business hours for minimum downtime.`,
    },
    {
      q: `Do I need a permit for ${service.name.toLowerCase()} in ${city.name}?`,
      a: `In most cases, painting projects in ${city.name} do not require a permit — whether interior or exterior painting, wallpaper installation, or specialty finishes. Permits may be required if structural work is involved, or if the property is a designated heritage building. If in doubt, Arcan Painting can advise based on your specific ${city.name} property and situation.`,
    },
    {
      q: `What's the best season for ${service.name.toLowerCase()} in ${city.name}?`,
      a: `For ${city.name} exterior projects, late spring through early fall (May–October) offers ideal temperatures above 10°C for proper paint adhesion and curing. Interior ${service.name.toLowerCase()} can be done year-round. If you're planning an exterior project, we recommend booking in early spring to secure your preferred dates — ${city.name} summer availability fills quickly.`,
    },
    {
      q: `Why choose Arcan Painting for ${service.name.toLowerCase()} in ${city.name}?`,
      a: `Arcan Painting has served ${city.name} and the ${city.region} since 1995 — that's 30+ years of local experience. We're fully licensed, carry full liability insurance, and every project comes with a ${service.warranty}. Our ${city.name} clients benefit from free colour consultation, premium materials, meticulous surface preparation, and a team that respects your home. Check our Google reviews to see what ${city.name} homeowners say about us.`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        <Header />
        <main>
          {/* ── Hero ── */}
          <section
            className="relative min-h-[520px] flex items-center"
            style={{
              background: `linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.6) 100%), url(${service.heroImg}) center/cover no-repeat`,
            }}
          >
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-white">
              <p className="text-amber-400 font-semibold tracking-wide uppercase text-sm mb-4">
                {city.region} · {city.province}
              </p>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
                {service.name} in {city.name}, Ontario
              </h1>
              <p className="text-xl lg:text-2xl text-slate-200 mb-8 max-w-2xl">
                {service.tagline} — Trusted by {city.name} homeowners since 1995. {service.warranty} included.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsLeadFormOpen(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg"
                >
                  Get Free {city.name} Quote
                </button>
                <a
                  href="tel:+14167272148"
                  className="bg-white/20 hover:bg-white/30 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all border border-white/30"
                >
                  Call (416) 727-2148
                </a>
              </div>
            </div>
          </section>

          {/* ── City Intro ── */}
          <section className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-12 items-start">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">
                    {service.name} in {city.name} — Local Expertise You Can Trust
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    {city.intro}
                  </p>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {city.challenge}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100">
                  <h3 className="font-bold text-slate-900 text-xl mb-6">Why Arcan Painting?</h3>
                  <ul className="space-y-3">
                    {[
                      `Serving ${city.name} since 1995`,
                      "Fully licensed & insured",
                      service.warranty,
                      "Free colour consultation",
                      "Premium low-VOC paints",
                      "Same-day cleanup",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <span className="text-amber-500 font-bold mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setIsLeadFormOpen(true)}
                    className="mt-8 w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-xl transition-all"
                  >
                    Free Quote
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Service Features ── */}
          <section className="py-16 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
                Our {service.name} Services in {city.name}
              </h2>
              <p className="text-slate-600 text-center text-lg mb-12 max-w-2xl mx-auto">
                {service.tagline}: everything {city.name} homeowners and businesses need for a beautiful, lasting finish.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {service.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-slate-100">
                    <span className="bg-amber-400 text-slate-900 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                      {i + 1}
                    </span>
                    <p className="text-slate-700 leading-relaxed">{feat}</p>
                  </div>
                ))}
              </div>

              {/* Service Types */}
              <div className="grid md:grid-cols-2 gap-6">
                {service.serviceTypes.map((type, i) => (
                  <div key={i} className="bg-white rounded-2xl p-7 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">{type.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Local Areas ── */}
          <section className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
                {service.name} Across {city.name}
              </h2>
              <p className="text-slate-600 text-center text-lg mb-10 max-w-2xl mx-auto">
                We provide {service.name.toLowerCase()} services throughout {city.name} and surrounding neighbourhoods — near {city.landmarks[0]} and beyond.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-12">
                {city.neighborhoods.map((hood, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                    <span className="text-slate-800 font-medium text-sm">{hood}</span>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-2xl mx-auto">
                <p className="text-slate-700 text-lg italic leading-relaxed mb-6">
                  "{city.testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-400 w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900">
                    {city.testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{city.testimonial.name}</p>
                    <p className="text-slate-500 text-sm">{city.testimonial.area}, {city.name}</p>
                  </div>
                  <div className="ml-auto text-amber-500 text-lg">★★★★★</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="py-16 bg-slate-50">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">
                {service.name} FAQ — {city.name}
              </h2>
              <div className="space-y-5">
                {faqItems.map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">{item.q}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Related Services ── */}
          <section className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
                More Painting Services in {city.name}
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {otherServices.map(([slug, svc]) => (
                  <a
                    key={slug}
                    href={`/${slug}/${citySlug}`}
                    className="group bg-slate-50 hover:bg-amber-50 rounded-xl p-5 border border-slate-200 hover:border-amber-300 transition-all text-center"
                  >
                    <p className="font-bold text-slate-900 group-hover:text-amber-700">{svc.name}</p>
                    <p className="text-slate-500 text-sm mt-1">{svc.tagline}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="py-20 bg-gradient-to-br from-amber-400 to-yellow-500">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Get Your Free {city.name} {service.name} Quote
              </h2>
              <p className="text-slate-800 text-xl mb-10">
                Serving {city.name} and the {city.region} since 1995. Licensed, insured, {service.warranty}.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setIsLeadFormOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all hover:scale-105 shadow-lg"
                >
                  Get Free Quote
                </button>
                <a
                  href="tel:+14167272148"
                  className="bg-white/30 hover:bg-white/50 text-slate-900 font-bold px-10 py-4 rounded-xl text-xl transition-all border border-slate-900/20"
                >
                  Call (416) 727-2148
                </a>
              </div>
              <p className="mt-6 text-slate-700">
                <a href="/" className="underline hover:text-slate-900 font-medium">← Back to Home</a>
                {" · "}
                <a href={`/${serviceSlug}`} className="underline hover:text-slate-900 font-medium">
                  All {service.name} Locations
                </a>
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {isLeadFormOpen && (
        <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />
      )}
    </>
  );
}

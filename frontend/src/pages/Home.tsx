import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Clapperboard,
  Compass,
  Heart,
  History,
  MessageCircle,
  Play,
  Users,
} from "lucide-react";
import { useAuth } from "../auth";
// The landing page has its own styles so the discovery workspace keeps its layout.
// Tailwind utilities live on the elements; home-* markers only identify sections and variants.

const paths = [
  {
    label: "For the watchers",
    icon: Compass,
    title: "Follow your curiosity.",
    description:
      "Find a fresh perspective, revisit a favorite, or fall into a new interest. Your next good watch is a little closer.",
    points: [
      "Explore the latest and most-viewed videos",
      "Keep your favorites in personal playlists",
      "Pick a video from your watch history",
    ],
    action: "Find your next watch",
    to: "/explore",
    note: "A little discovery goes a long way.",
    theme: "watch",
  },
  {
    label: "For the creators",
    icon: Clapperboard,
    title: "Give your ideas a home.",
    description:
      "From your first upload to your next creative chapter. Share your videos, shape your channel, and see how your work connects.",
    points: [
      "Upload a video with your own thumbnail",
      "Save a draft or publish when you're ready",
      "Manage your videos and see channel totals",
    ],
    action: "Open creator studio",
    to: "/studio",
    note: "Something only you can make.",
    theme: "create",
  },
  {
    label: "For the community",
    icon: Users,
    title: "Stay for the conversation.",
    description:
      "There's a person behind every video. Follow the creators you enjoy, share a thought, and keep the conversation going between uploads.",
    points: [
      "Subscribe to the channels you want to follow",
      "Leave a comment on a video you love",
      "Share updates through community posts",
    ],
    action: "Meet the community",
    to: "/community",
    note: "Good videos. Even better company.",
    theme: "connect",
  },
];
const features = [
  {
    icon: Compass,
    title: "A new rabbit hole awaits.",
    description: "Browse, search, and discover videos that spark an interest.",
    to: "/explore",
    tag: "DISCOVER",
    color: "lavender",
  },
  {
    icon: Bookmark,
    title: "Keep the good ones close.",
    description:
      "Make playlists for a mood, a project, or your next quiet Sunday.",
    to: "/playlists",
    tag: "COLLECT",
    color: "peach",
  },
  {
    icon: Clapperboard,
    title: "From your mind to the grid.",
    description:
      "Upload your work, make it your own, and publish on your terms.",
    to: "/studio/upload",
    tag: "CREATE",
    color: "green",
  },
  {
    icon: Users,
    title: "Find your kind of people.",
    description:
      "Follow creators and catch their latest videos in your subscriptions.",
    to: "/subscriptions",
    tag: "FOLLOW",
    color: "green",
  },
  {
    icon: MessageCircle,
    title: "More than a play button.",
    description:
      "Leave a comment, share an update, and be part of the conversation.",
    to: "/community",
    tag: "CONNECT",
    color: "lavender",
  },
  {
    icon: History,
    title: "That one video? Found it.",
    description:
      "Your watch history and liked videos make returning to favorites easy.",
    to: "/history",
    tag: "REVISIT",
    color: "peach",
  },
];

const artwork = "/images/home/";

// Promotional artwork illustrates the experience; it is not a feed of uploaded videos.
function PhotoCard({
  image,
  alt,
  label,
  title,
  className = "",
  to = "/explore",
}: {
  image: string;
  alt: string;
  label: string;
  title: string;
  className?: string;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className={`home-photo-card relative rounded-[17px] overflow-hidden block isolate bg-[#ece4f8] [&::after]:content-[''] [&::after]:absolute [&::after]:[inset:30%_0_0] [&::after]:bg-[linear-gradient(transparent,_#101016bd)] [&::after]:z-[-1] [&_img]:h-full [&_img]:w-full [&_img]:block [&_img]:absolute [&_img]:inset-0 [&_img]:z-[-2] [&_img]:[transition:transform_0.5s] [&:hover_img]:[transform:scale(1.035)] ${className}`}
    >
      <img src={`${artwork}${image}.jpg`} alt={alt} width="640" height="960" />
      <span className="home-photo-label absolute top-[21px] left-[21px] right-[14px] text-[9px] text-[white] font-[650] tracking-[1.2px] [text-shadow:0_1px_7px_#0009] max-[1051px]:text-[8px] max-[1051px]:left-[17px] max-[761px]:text-[7px] max-[761px]:tracking-[0.8px] max-[761px]:top-[17px] max-[761px]:left-[15px]">
        {label}
      </span>
      <div className="home-photo-caption absolute bottom-[24px] left-[23px] right-[19px] flex items-end gap-[12px] text-[white] [&_h3]:text-[clamp(20px,_2.1vw,_29px)] [&_h3]:leading-[1.2] [&_h3]:tracking-[-0.8px] [&_h3]:max-w-[205px] max-[1051px]:left-[17px] max-[1051px]:right-[14px] max-[1051px]:[&_h3]:text-[23px] max-[761px]:left-[15px] max-[761px]:bottom-[20px] max-[761px]:[&_h3]:text-[23px]">
        <h3>{title}</h3>
        <span className="home-round-arrow w-[34px] h-[34px] grid place-items-center border-[1px] border-solid border-[#ffffff73] rounded-full shrink-0 ml-auto max-[1051px]:hidden">
          <ArrowUpRight size={20} />
        </span>
      </div>
    </Link>
  );
}

export function Home() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(0);
  const useCase = paths[selected];
  return (
    <div className="home-route bg-[#fff] text-[#19181e] [--home-purple:#6944cb] overflow-clip [&_.lavender]:bg-[#eaddfa] [&_.peach]:bg-[#ffe5d7] [&_.green]:bg-[#def0e7] [&_.blue]:bg-[#daf0f5] motion-reduce:[&_*]:[transition:none]! motion-reduce:[&_*]:[scroll-behavior:auto]! motion-reduce:[&_*::before]:[transition:none]! motion-reduce:[&_*::before]:[scroll-behavior:auto]! motion-reduce:[&_*::after]:[transition:none]! motion-reduce:[&_*::after]:[scroll-behavior:auto]!">
      <a className="skip-link" href="#home-main">
        Skip to content
      </a>
      <header className="home-header h-[100px] flex items-center gap-[52px] [&_nav]:flex [&_nav]:gap-[28px] [&_nav]:text-[13px] [&_nav]:font-[550] [&_nav_a:hover]:text-[var(--home-purple)] max-[1051px]:gap-[30px] max-[1051px]:[&_nav]:gap-[17px] max-[761px]:h-[80px] max-[761px]:gap-[12px] max-[761px]:[&_nav]:hidden home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)]">
        <Link
          className="home-logo inline-flex items-center gap-[9px] text-[25px] font-extrabold tracking-[-1.2px] whitespace-nowrap [&_>_span]:w-[33px] [&_>_span]:h-[33px] [&_>_span]:grid [&_>_span]:place-items-center [&_>_span]:rounded-[10px] [&_>_span]:bg-[#cab6f3] [&_>_span]:text-[#30234d] max-[761px]:text-[22px]"
          to="/"
          aria-label="PlayGrid home"
        >
          <span>
            <Play size={19} fill="currentColor" />
          </span>
          PlayGrid
        </Link>
        <nav aria-label="Homepage navigation">
          <a href="#possibilities">Made for you</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="home-nav-actions ml-auto flex gap-[12px] items-center max-[761px]:gap-[8px]">
          <Link
            className="home-signin border-[1px] border-solid border-[#e4e1e9] rounded-[30px] py-[11px] px-[21px] text-[13px] font-semibold whitespace-nowrap max-[761px]:py-[10px] max-[761px]:px-[13px] max-[761px]:text-[12px]"
            to={user ? "/studio" : "/login"}
          >
            {user ? "Your studio" : "Sign in"}
          </Link>
          <Link
            className="home-button inline-flex items-center justify-center gap-[22px] bg-[linear-gradient(110deg,_#8c65e1,_#6035c2)] text-[#fff] rounded-[30px] py-[17px] px-[25px] text-[14px] font-semibold [transition:transform_0.2s,_box-shadow_0.2s] whitespace-nowrap [&:hover]:[transform:translateY(-2px)] [&:hover]:shadow-[0_6px_18px_#6a44c32b] home-button-small py-[12px]! px-[19px]! gap-[13px]! text-[13px]! max-[761px]:text-[12px]! max-[761px]:py-[11px]! max-[761px]:px-[14px]! max-[761px]:gap-[7px]! max-[761px]:[&_svg]:hidden!"
            to="/explore"
          >
            Explore PlayGrid <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main className="home-main p-0 m-0 max-w-none w-full" id="home-main">
        <section className="home-hero flex flex-col items-center text-center gap-6 pt-12 pb-20 [&_.home-eyebrow]:flex [&_.home-eyebrow]:justify-center [&_.home-eyebrow]:items-center [&_.home-eyebrow]:gap-[8px] [&_.home-eyebrow]:mb-[22px] [&_.home-eyebrow_>_span]:w-[6px] [&_.home-eyebrow_>_span]:h-[6px] [&_.home-eyebrow_>_span]:rounded-full [&_.home-eyebrow_>_span]:bg-[#835bcf] [&_h1]:text-[clamp(40px,_4vw,_56px)] [&_h1]:leading-[1.16] [&_h1]:tracking-[-2px] [&_h1]:font-extrabold [&_h1_span]:text-[#6a47b7] min-[1500px]:pt-14 max-[1051px]:pt-10 max-[1051px]:[&_h1]:text-[43px] max-[1051px]:[&_h1]:tracking-[-2px] max-[761px]:flex-col max-[761px]:items-center max-[761px]:pt-[39px] max-[761px]:pb-14 max-[761px]:gap-[27px] max-[761px]:[&_h1]:text-[clamp(36px,_6.6vw,_48px)] max-[761px]:[&_h1]:tracking-[-1.9px] max-[761px]:[&_h1_br]:hidden max-[761px]:[&_h1_span]:block max-[761px]:[&_.home-eyebrow]:text-[9px] max-[761px]:[&_.home-eyebrow]:mb-[18px] home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)]">
          <div className="home-hero-copy w-full max-w-[840px] [&_>_p]:mx-auto [&_>_p]:text-[15px] [&_>_p]:leading-[1.8] [&_>_p]:text-[#65616c] [&_>_p]:mt-[25px] max-[1051px]:[&_>_p]:text-[13px] max-[761px]:[&_>_p]:text-[14px] max-[761px]:[&_>_p]:mt-[19px] max-[761px]:[&_>_p]:max-w-[530px]">
            <div className="home-eyebrow block text-[#6944bd] text-[11px] font-bold tracking-[1.3px] max-[761px]:text-[9px] max-[761px]:tracking-[1px]">
              <span /> GOOD VIDEOS. GREAT COMPANY.
            </div>
            <h1>
              Your interests. Your people.
              <br />
              <span>All on one grid.</span>
            </h1>
            <p>
              Watch something that moves you. Share something only you can make.
              <br className="home-desktop-break max-[1051px]:hidden" /> Find
              your creative corner of the internet, right here on PlayGrid.
            </p>
          </div>
          <div className="home-hero-actions flex flex-wrap items-center justify-center gap-x-5 gap-y-3 max-[761px]:flex-col max-[761px]:items-center [&_>_span]:text-xs [&_>_span]:text-[#716a7b]">
            <Link
              className="home-button inline-flex items-center justify-center gap-[22px] bg-[linear-gradient(110deg,_#8c65e1,_#6035c2)] text-[#fff] rounded-[30px] py-[17px] px-[25px] text-[14px] font-semibold [transition:transform_0.2s,_box-shadow_0.2s] whitespace-nowrap [&:hover]:[transform:translateY(-2px)] [&:hover]:shadow-[0_6px_18px_#6a44c32b]"
              to="/explore"
            >
              Explore videos <ArrowUpRight size={19} />
            </Link>
            <span>Jump in. No account needed to watch.</span>
          </div>
        </section>
        <section
          className="home-gallery w-[calc(100%_-_112px)] max-w-[1240px] mx-auto grid grid-cols-4 items-start gap-5 max-[1051px]:gap-[14px] max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:grid-cols-2 max-[761px]:gap-[13px] max-[761px]:w-[calc(100%_-_40px)]"
          aria-label="Discover the possibilities on PlayGrid"
        >
          <PhotoCard
            image="travel"
            alt="A hiker looking out over sunlit mountain peaks"
            label="FOLLOW YOUR CURIOSITY"
            title="A different point of view."
            className="home-gallery-travel h-[336px] mt-14 max-[761px]:h-[270px] max-[761px]:mt-[30px] [&_img]:object-[center_65%]"
          />
          <PhotoCard
            image="music"
            alt="A woman enjoying music in colorful studio lighting"
            label="FIND YOUR NEXT OBSESSION"
            title="More of what moves you."
            className="home-gallery-music h-[416px] max-[761px]:h-[300px]"
          />
          <div className="home-gallery-stack grid gap-5 max-[761px]:pt-[0] max-[761px]:gap-[13px]">
            <Link
              to="/studio/upload"
              className="home-statement min-h-[196px] p-[23px] rounded-[17px] flex flex-col items-start [&_strong]:font-[Manrope,sans-serif] [&_strong]:text-[clamp(25px,_2.5vw,_35px)] [&_strong]:leading-[1.12] [&_strong]:tracking-[-1.2px] [&_strong]:mt-[12px] [&_>_span]:w-full [&_>_span]:flex [&_>_span]:items-center [&_>_span]:justify-between [&_>_span]:gap-[10px] [&_>_span]:text-[10px] [&_>_span]:mt-[16px] [&_>_span_svg]:shrink-0 max-[1051px]:p-[20px] max-[1051px]:[&_>_span]:leading-[1.5] max-[761px]:min-h-[155px] max-[761px]:p-[18px] max-[761px]:[&_strong]:text-[26px] max-[761px]:[&_>_svg]:w-[20px] max-[761px]:[&_>_svg]:h-[20px] max-[761px]:[&_>_span]:text-[9px] max-[761px]:[&_>_span]:mt-[14px] home-statement-purple text-[#fff] bg-[linear-gradient(135deg,_#ad8bef,_#7545cc)]"
            >
              <Clapperboard size={24} strokeWidth={1.75} aria-hidden="true" />
              <strong>
                Big ideas.
                <br />
                Your stage.
              </strong>
              <span>
                From first take to first upload.
                <ArrowUpRight size={20} />
              </span>
            </Link>
            <Link
              to="/playlists"
              className="home-statement min-h-[196px] p-[23px] rounded-[17px] flex flex-col items-start [&_strong]:font-[Manrope,sans-serif] [&_strong]:text-[clamp(25px,_2.5vw,_35px)] [&_strong]:leading-[1.12] [&_strong]:tracking-[-1.2px] [&_strong]:mt-[12px] [&_>_span]:w-full [&_>_span]:flex [&_>_span]:items-center [&_>_span]:justify-between [&_>_span]:gap-[10px] [&_>_span]:text-[10px] [&_>_span]:mt-[16px] [&_>_span_svg]:shrink-0 max-[1051px]:p-[20px] max-[1051px]:[&_>_span]:leading-[1.5] max-[761px]:min-h-[155px] max-[761px]:p-[18px] max-[761px]:[&_strong]:text-[26px] max-[761px]:[&_>_svg]:w-[20px] max-[761px]:[&_>_svg]:h-[20px] max-[761px]:[&_>_span]:text-[9px] max-[761px]:[&_>_span]:mt-[14px] home-statement-peach bg-[linear-gradient(130deg,_#ffe0c6,_#ffb391)] text-[#583324] min-h-[178px]"
            >
              <Bookmark size={24} strokeWidth={1.75} aria-hidden="true" />
              <strong>
                Keep the
                <br />
                good stuff.
              </strong>
              <span>
                A playlist for every side of you.
                <ArrowUpRight size={20} />
              </span>
            </Link>
          </div>
          <PhotoCard
            image="creator"
            alt="A filmmaker in an orange beanie holding a camera"
            label="MADE TO BE SHARED"
            title="Your story starts here."
            className="home-gallery-creator h-[336px] mt-14 max-[761px]:mt-[0] max-[761px]:h-full max-[761px]:min-h-[340px] [&_img]:object-[center_16%]"
            to={user ? "/studio/upload" : "/register"}
          />
        </section>
        <div className="home-interest-strip text-center pt-[56px] pb-[65px] [border-bottom:1px_solid_#f0edf3] [&_p]:text-[#77717d] [&_p]:text-[12px] [&_>_div]:mt-[27px] [&_>_div]:flex [&_>_div]:items-center [&_>_div]:justify-center [&_>_div]:gap-[34px] [&_>_div]:text-[#807887] [&_span]:text-[13px] [&_span]:font-[650] [&_span]:tracking-[1.7px] [&_svg]:text-[#b9a6d5] max-[1051px]:[&_>_div]:gap-[22px] max-[1051px]:[&_span]:text-[11px] max-[761px]:pt-[36px] max-[761px]:pb-[39px] max-[761px]:[&_>_div]:flex-wrap max-[761px]:[&_>_div]:gap-[15px_20px] max-[761px]:[&_>_div]:max-w-[420px] max-[761px]:[&_>_div]:mx-auto max-[761px]:[&_svg]:hidden max-[761px]:[&_span]:text-[9px] max-[761px]:[&_span]:tracking-[1.2px] home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)]">
          <p>A space for every side of you.</p>
          <div>
            <span>THE CURIOUS</span>
            <span>THE STORYTELLERS</span>
            <span>THE DAYDREAMERS</span>
            <span>THE DOERS</span>
          </div>
        </div>
        <section
          className="home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)] home-usecases pt-[84px] pb-[90px] max-[761px]:py-[55px]"
          id="possibilities"
        >
          <div className="home-section-heading text-center [&_h2]:text-[clamp(30px,_3.2vw,_44px)] [&_h2]:font-extrabold [&_h2]:leading-[1.22] [&_h2]:tracking-[-1.8px] [&_h2]:mt-[15px] [&_p]:text-[14px] [&_p]:text-[#706977] [&_p]:leading-[1.8] [&_p]:mt-[20px] max-[761px]:[&_h2]:text-[32px] max-[761px]:[&_h2]:tracking-[-1.3px] max-[761px]:[&_p]:text-[13px]">
            <span className="home-eyebrow block text-[#6944bd] text-[11px] font-bold tracking-[1.3px] max-[761px]:text-[9px] max-[761px]:tracking-[1px]">
              YOUR KIND OF PLACE
            </span>
            <h2>
              Come for a video.
              <br />
              Stay for the possibilities.
            </h2>
            <p>
              A little inspiration, a new creative outlet, or people who share
              your interests.
              <br className="home-desktop-break max-[1051px]:hidden" /> There’s
              more than one way to make PlayGrid yours.
            </p>
          </div>
          <div
            className="home-case-tabs flex justify-center gap-[10px] my-[31px] mx-[0] [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:gap-[9px] [&_button]:rounded-[30px] [&_button]:border-[1px] [&_button]:border-solid [&_button]:border-[#e9e4ef] [&_button]:py-[13px] [&_button]:px-[23px] [&_button]:text-[#6a6373] [&_button]:text-[13px] [&_button[aria-selected=true]]:bg-[#eee7fb] [&_button[aria-selected=true]]:text-[#53368c] [&_button[aria-selected=true]]:border-[#d8c5f5] [&_button:hover]:bg-[#f5f0fb] max-[761px]:gap-[6px] max-[761px]:my-[26px] max-[761px]:[&_button]:text-[10px] max-[761px]:[&_button]:py-[11px] max-[761px]:[&_button]:px-[10px] max-[761px]:[&_button]:gap-[5px] max-[761px]:[&_button]:flex-1 max-[761px]:[&_button_svg]:hidden"
            role="tablist"
            aria-label="Ways to use PlayGrid"
          >
            {paths.map(({ label, icon: Icon }, index) => (
              <button
                key={label}
                role="tab"
                id={`case-tab-${index}`}
                aria-selected={selected === index}
                aria-controls="home-case-panel"
                tabIndex={selected === index ? 0 : -1}
                onClick={() => setSelected(index)}
                onKeyDown={(event) => {
                  let next = selected;
                  if (event.key === "ArrowRight")
                    next = (selected + 1) % paths.length;
                  else if (event.key === "ArrowLeft")
                    next = (selected + paths.length - 1) % paths.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = paths.length - 1;
                  else return;
                  event.preventDefault();
                  setSelected(next);
                  document.getElementById(`case-tab-${next}`)?.focus();
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
          <div
            className={`home-case-panel grid grid-cols-[0.95fr_1.05fr] bg-[#f5f2fb] rounded-[20px] overflow-hidden min-h-[355px] [&.create]:bg-[#fff2e8] [&.connect]:bg-[#eff6f3] max-[761px]:grid-cols-[1fr] [&.watch_.home-case-visual_img]:object-[center_66%] [&.create_.home-case-visual_img]:object-[center_top] ${useCase.theme}`}
            role="tabpanel"
            id="home-case-panel"
            aria-labelledby={`case-tab-${selected}`}
            tabIndex={0}
          >
            <div className="home-case-visual relative min-h-[355px] overflow-hidden [&_img]:absolute [&_img]:h-full [&_img]:w-full [&_img]:object-[center_48%] [&::after]:content-[''] [&::after]:absolute [&::after]:[inset:40%_0_0] [&::after]:bg-[linear-gradient(transparent,_#171923b8)] [&_>_div]:absolute [&_>_div]:left-[32px] [&_>_div]:right-[30px] [&_>_div]:bottom-[31px] [&_>_div]:text-[white] [&_>_div]:z-[1] [&_span]:block [&_span]:text-[10px] [&_span]:tracking-[1.5px] [&_span]:mb-[12px] [&_strong]:font-[Manrope,sans-serif] [&_strong]:block [&_strong]:max-w-[320px] [&_strong]:text-[30px] [&_strong]:leading-[1.2] [&_strong]:tracking-[-1px] max-[761px]:min-h-[240px] max-[761px]:[&_strong]:text-[27px]">
              <img
                src={`${artwork}${["travel", "creator", "music"][selected]}.jpg`}
                alt={
                  [
                    "A hiker discovering a mountain landscape",
                    "A filmmaker ready to share a story",
                    "A music lover finding inspiration",
                  ][selected]
                }
                width="640"
                height="960"
                loading="lazy"
              />
              <div>
                <span>0{selected + 1} / MAKE IT YOURS</span>
                <strong>{useCase.note}</strong>
              </div>
            </div>
            <div className="home-case-copy py-[43px] px-[48px] self-center [&_h3]:text-[27px] [&_h3]:tracking-[-1px] [&_p]:text-[13px] [&_p]:text-[#6c6477] [&_p]:mt-[14px] [&_ul]:list-none [&_ul]:p-0 [&_ul]:my-[23px] [&_ul]:mx-[0] [&_ul]:grid [&_ul]:gap-[12px] [&_li]:flex [&_li]:gap-[10px] [&_li]:text-[12px] [&_li]:items-center [&_li_svg]:text-[#7759ac] [&_li_svg]:shrink-0 max-[1051px]:p-[30px] max-[761px]:pt-[29px] max-[761px]:px-[25px] max-[761px]:pb-[34px] max-[761px]:[&_h3]:text-[25px] max-[761px]:[&_li]:text-[12px]">
              <h3>{useCase.title}</h3>
              <p>{useCase.description}</p>
              <ul>
                {useCase.points.map((point) => (
                  <li key={point}>
                    <Check size={17} />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                className="home-text-link text-[#6742b5] text-[12px] font-[650] inline-flex gap-[10px] items-center [&:hover]:underline [&:hover]:underline-offset-[4px]"
                to={useCase.to}
              >
                {useCase.action}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </section>
        <section
          className="home-feature-section pt-[76px] px-[0] pb-[88px] bg-[#fcfbfe] max-[761px]:py-[52px]"
          id="features"
        >
          <div className="home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)]">
            <div className="home-section-heading text-center [&_h2]:text-[clamp(30px,_3.2vw,_44px)] [&_h2]:font-extrabold [&_h2]:leading-[1.22] [&_h2]:tracking-[-1.8px] [&_h2]:mt-[15px] [&_p]:text-[14px] [&_p]:text-[#706977] [&_p]:leading-[1.8] [&_p]:mt-[20px] max-[761px]:[&_h2]:text-[32px] max-[761px]:[&_h2]:tracking-[-1.3px] max-[761px]:[&_p]:text-[13px]">
              <span className="home-eyebrow block text-[#6944bd] text-[11px] font-bold tracking-[1.3px] max-[761px]:text-[9px] max-[761px]:tracking-[1px]">
                SMALL DETAILS. MORE POSSIBILITIES.
              </span>
              <h2>
                Everything you need.
                <br />
                Room to make it your own.
              </h2>
              <p>
                Thoughtful tools for watching, creating, and keeping the
                conversation going.
              </p>
            </div>
            <div className="home-feature-grid grid grid-cols-[repeat(3,_1fr)] gap-x-[72px] gap-y-[48px] mt-[56px] max-[1051px]:gap-x-[35px] max-[761px]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-[761px]:gap-[34px_23px] max-[761px]:mt-[37px]">
              {features.map(({ icon: Icon, ...feature }) => (
                <article
                  className="home-feature-card [&_h3]:text-[17px] [&_h3]:tracking-[-0.5px] [&_p]:mt-[12px] [&_p]:mx-[0] [&_p]:mb-[19px] [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:text-[#716b79] [&_p]:max-w-[295px] max-[761px]:[&_h3]:text-[16px] max-[761px]:[&_h3]:leading-[1.4] max-[761px]:[&_p]:text-[12px] max-[761px]:[&_p]:mt-[10px]"
                  key={feature.tag}
                >
                  <span
                    className="home-feature-icon inline-flex text-[#514c5b] mb-5 max-[761px]:mb-4"
                    aria-hidden="true"
                  >
                    <Icon size={24} strokeWidth={1.75} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link
                    className="home-text-link text-[#6742b5] text-[12px] font-[650] inline-flex gap-[10px] items-center [&:hover]:underline [&:hover]:underline-offset-[4px]"
                    to={feature.to}
                  >
                    {" "}
                    {feature.tag.charAt(0) + feature.tag.slice(1).toLowerCase()}
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          className="home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)] home-steps py-[88px] max-[761px]:py-[54px]"
          id="how-it-works"
        >
          <div className="home-section-heading text-center [&_h2]:text-[clamp(30px,_3.2vw,_44px)] [&_h2]:font-extrabold [&_h2]:leading-[1.22] [&_h2]:tracking-[-1.8px] [&_h2]:mt-[15px] [&_p]:text-[14px] [&_p]:text-[#706977] [&_p]:leading-[1.8] [&_p]:mt-[20px] max-[761px]:[&_h2]:text-[32px] max-[761px]:[&_h2]:tracking-[-1.3px] max-[761px]:[&_p]:text-[13px] home-heading-split flex text-left! items-center justify-between gap-[40px] [&_.home-button]:mt-[22px]! [&_p]:mt-[0]! max-[761px]:flex-col max-[761px]:items-start max-[761px]:gap-[23px]">
            <div>
              <span className="home-eyebrow block text-[#6944bd] text-[11px] font-bold tracking-[1.3px] max-[761px]:text-[9px] max-[761px]:tracking-[1px]">
                YOUR NEXT CHAPTER
              </span>
              <h2>
                Less setup.
                <br />
                More pressing play.
              </h2>
            </div>
            <div>
              <p>
                You bring the curiosity. We’ll give it a home.
                <br />
                Start watching now, or join in to make it yours.
              </p>
              <Link
                className="home-button inline-flex items-center justify-center gap-[22px] bg-[linear-gradient(110deg,_#8c65e1,_#6035c2)] text-[#fff] rounded-[30px] py-[17px] px-[25px] text-[14px] font-semibold [transition:transform_0.2s,_box-shadow_0.2s] whitespace-nowrap [&:hover]:[transform:translateY(-2px)] [&:hover]:shadow-[0_6px_18px_#6a44c32b]"
                to={user ? "/studio/upload" : "/register"}
              >
                {user ? "Upload a video" : "Start creating"}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <div className="home-step-grid grid grid-cols-[repeat(3,_1fr)] gap-[23px] mt-[38px] [&_article]:rounded-[17px] [&_article]:p-[29px] [&_h3]:text-[21px] [&_h3]:tracking-[-0.8px] [&_p]:text-[13px] [&_p]:text-[#59515f] [&_p]:mt-[14px] max-[761px]:grid-cols-[1fr] max-[761px]:gap-[14px] max-[761px]:mt-[30px] max-[761px]:[&_article]:p-[25px] max-[761px]:[&_h3]:text-[23px]">
            {[
              {
                title: "Find your next thing.",
                text: "Browse and watch published videos. Follow an interest and see where it takes you.",
                icon: Compass,
                color: "blue",
              },
              {
                title: "Make a little space.",
                text: "Create an account to save favorites, build playlists, and follow your kind of creators.",
                icon: Heart,
                color: "lavender",
              },
              {
                title: "Put yourself out there.",
                text: "Share a video, post an update, or join a conversation. Your perspective belongs here.",
                icon: Clapperboard,
                color: "peach",
              },
            ].map(({ title, text, color }, index) => (
              <article key={title} className={color}>
                <div className="home-step-number flex items-center justify-between mb-[38px] [&_span]:font-[Manrope,sans-serif] [&_span]:text-[41px] [&_span]:font-extrabold [&_span]:tracking-[-2px] [&_span]:opacity-[0.6] max-[761px]:mb-[20px]">
                  <span>0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)] home-bottom-wrap pb-[65px] max-[761px]:pb-[42px]">
          <div className="home-bottom-cta text-center rounded-[22px] bg-[#f1ebfa] py-[64px] px-[24px] [&_h2]:text-[clamp(34px,_4vw,_54px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-2px] [&_h2]:mt-[19px] [&_p]:text-[#736580] [&_p]:mt-[20px] [&_p]:mx-[0] [&_p]:mb-[26px] [&_p]:text-[14px] max-[761px]:py-[45px] max-[761px]:px-[16px] max-[761px]:[&_h2]:text-[36px] max-[761px]:[&_h2]:tracking-[-1.6px]">
            <span className="home-eyebrow block text-[#6944bd] text-[11px] font-bold tracking-[1.3px] max-[761px]:text-[9px] max-[761px]:tracking-[1px]">
              A LITTLE CURIOSITY GOES A LONG WAY
            </span>
            <h2>
              Your next favorite thing
              <br />
              is out there.
            </h2>
            <p>Let’s see what’s on the grid.</p>
            <Link
              className="home-button inline-flex items-center justify-center gap-[22px] bg-[linear-gradient(110deg,_#8c65e1,_#6035c2)] text-[#fff] rounded-[30px] py-[17px] px-[25px] text-[14px] font-semibold [transition:transform_0.2s,_box-shadow_0.2s] whitespace-nowrap [&:hover]:[transform:translateY(-2px)] [&:hover]:shadow-[0_6px_18px_#6a44c32b]"
              to="/explore"
            >
              Let’s explore <ArrowUpRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="home-footer [&_nav_a:hover]:text-[var(--home-purple)] flex justify-between items-center pt-[8px] pb-[36px] gap-[30px] [&_.home-logo]:text-[22px] [&_p]:text-[#847c8c] [&_p]:text-[11px] [&_p]:mt-[12px] [&_nav]:flex [&_nav]:gap-[25px] [&_nav]:text-[12px] [&_>_span]:text-[#847c8c] [&_>_span]:text-[11px] max-[761px]:flex-wrap max-[761px]:gap-[25px] max-[761px]:pb-[28px] max-[761px]:[&_nav]:gap-[17px] max-[761px]:[&_nav]:text-[11px] max-[761px]:[&_>_span]:w-full home-container w-[calc(100%_-_112px)] max-w-[1240px] mx-auto max-[1051px]:w-[calc(100%_-_64px)] max-[761px]:w-[calc(100%_-_40px)]">
        <div>
          <Link
            className="home-logo inline-flex items-center gap-[9px] text-[25px] font-extrabold tracking-[-1.2px] whitespace-nowrap [&_>_span]:w-[33px] [&_>_span]:h-[33px] [&_>_span]:grid [&_>_span]:place-items-center [&_>_span]:rounded-[10px] [&_>_span]:bg-[#cab6f3] [&_>_span]:text-[#30234d] max-[761px]:text-[22px]"
            to="/"
          >
            <span>
              <Play size={17} fill="currentColor" />
            </span>
            PlayGrid
          </Link>
          <p>Good videos. Great company.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/explore">Explore</Link>
          <Link to="/community">Community</Link>
          <Link to="/studio">Creator studio</Link>
        </nav>
        <span>© {new Date().getFullYear()} PlayGrid</span>
      </footer>
    </div>
  );
}

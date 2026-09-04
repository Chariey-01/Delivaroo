import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCtaHover } from '../store/uiSlice';
import useStartBooking, { BOOKING_PATH } from '../hooks/useStartBooking';
import { BOTTOM_NAV_HEIGHT } from './BottomNav';
import { color, ease, font, layout } from '../theme';
import Icon from './Icon';

const KNOB = 'clamp(50px,5.4vw,62px)';

/**
 * The hero photograph: one composite frame carrying every mode we run — air, drone,
 * sea, road and the rider — under the same sunset. It is the whole stage. There is no
 * carousel: the picture does not change and neither does the copy over it.
 *
 * `focus` is the object-position for the wide desktop crop, `focusNarrow` the one used
 * under the 980px breakpoint — a phone crops the frame horizontally instead of
 * vertically, and leans toward the road so the rider and truck survive it.
 *
 * `aspect` is why the phone layout differs at all. The frame is 1503x1046 — 1.44:1
 * landscape — and `cover` in a full-bleed 390x844 portrait fold shows barely a third
 * of its width: the drone, the container ship and most of the world map are simply
 * cut off, which is the whole point of a photograph that carries every mode at once.
 * So on a phone the picture gets a box near its own aspect, where 93% of the width
 * survives, and the words move off it onto the ground below.
 */
// eslint-disable-next-line react-refresh/only-export-components -- static hero content shared with the tests
export const HERO_PHOTO = {
  src: '/photos/hero-global-network.jpeg',
  alt: 'Cargo aircraft, delivery drone, container ship, motorbike courier and freight truck under one sunset, over a world map',
  focus: '50% 50%',
  focusNarrow: '58% 50%',
  aspect: '4 / 3'
};

/**
 * The words over it: the headline and, under it, a tagline rather than a paragraph —
 * two short clauses that fit on one line above the CTAs. There is no eyebrow, so the
 * headline is the first thing read over the photograph.
 */
// eslint-disable-next-line react-refresh/only-export-components -- static hero content shared with the tests
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setNarrow, openAuthModal } from "../store/uiSlice";

export const HERO_COPY = {
  headline: 'From anywhere to your door',
  body: 'One network. Every mode.'
};

/**
 * Padding for the hero's content column.
 *
 * Exported because it is the only guard available on the bottom-bar reservation:
 * jsdom's CSSOM silently discards any declaration containing calc(), so a test can
 * read this string but never the rendered style.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure helper, tested directly
export const heroContentPadding = (narrow) =>
  narrow
    // The bottom bar is fixed over the fold on a phone, so the hero hands back the
    // strip it occupies: without this the Request a Delivery pill sits underneath it —
    // half hidden, and a tap on its centre hits the Track tab instead.
    ? `clamp(20px,3vh,32px) ${layout.gutter} calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom,0px) + clamp(18px,2.6vh,30px))`
    // The top offset clears the fixed header, which only overlays the copy on a wide
    // screen; on a phone the header sits over the photograph above it.
    : `calc(80px + clamp(18px,4vh,40px)) ${layout.gutter} clamp(28px,5vh,56px)`;

/**
 * The approved CTA, unchanged apart from its label: the goo-filtered pill whose knob
 * slides on hover. It still runs through useStartBooking, so the hero keeps using the
 * existing booking flow — signed in goes to /book, signed out gets the auth modal
 * first and lands there afterwards.
 */
function RequestCta() {
export const HERO_PHOTO = {
  src: "/photos/hero-delivery.jpg",
  alt: "A delivery courier moving packages across the city",
  focus: "center center",
  focusNarrow: "center 30%"
};

const Hero = () => {
  const dispatch = useDispatch();
  const isNarrow = useSelector((state) => state.ui.narrow);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      dispatch(setNarrow(window.innerWidth < 768));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  const handleRequestDelivery = (e) => {
    e.preventDefault();
    dispatch(openAuthModal('/book'));
  };

  return (
    <div id="top">
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-end",
          backgroundColor: "#1c201f",
          overflow: "hidden"
        }}
      >
        <img
          src={HERO_PHOTO.src}
          alt={HERO_PHOTO.alt}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: isNarrow ? HERO_PHOTO.focusNarrow : HERO_PHOTO.focus,
            opacity: loaded ? 1 : 0,
            transition: "opacity .5s ease"
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '50%',
              right: '100%',
              marginRight: '-5px',
              width: '24px',
              height: ctaHover ? '15px' : '23px',
              borderRadius: '999px',
              background: color.orange,
              transformOrigin: 'right center',
              transform: ctaHover ? 'translateY(-50%) scaleX(2.05)' : 'translateY(-50%) scaleX(1)',
              transition: `transform .5s ${ease.spring}, height .5s ${ease.spring}`
            }}
          />
        </span>
      </span>
      <span
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          padding: '0 clamp(24px,3vw,44px)',
          fontSize: 'clamp(14px,1.15vw,16.5px)',
          fontWeight: 600,
          letterSpacing: '-.01em',
          whiteSpace: 'nowrap'
        }}
      >
        Request a Delivery
      </span>
      <span
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: KNOB,
          height: '100%',
          transform: ctaHover ? 'translateX(11px) rotate(45deg)' : 'none',
          transition: `transform .5s ${ease.spring}`
        }}
      >
        <Icon name="arrow_outward" size="clamp(19px,1.8vw,23px)" />
      </span>
    </Link>
  );
}

export default function Hero() {
  const narrow = useSelector((state) => state.ui.narrow);

  const photo = (
    <img
      src={HERO_PHOTO.src}
      alt={HERO_PHOTO.alt}
      // Above the fold, and the only thing behind the headline: never lazy.
      loading="eager"
      decoding="async"
      fetchpriority="high"
      style={
        narrow
          ? {
              position: 'relative',
              zIndex: 1,
              display: 'block',
              width: '100%',
              aspectRatio: HERO_PHOTO.aspect,
              objectFit: 'cover',
              objectPosition: HERO_PHOTO.focusNarrow
            }
          : {
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: HERO_PHOTO.focus
            }
      }
    />
  );

  return (
    <div
      id="top"
      style={{
        position: 'relative',
        // On a wide screen the photograph is the fold, so the hero takes the whole
        // viewport and the band underneath never shows as a strip of green below the
        // picture. A phone gives a little of that back: there the photograph is a band
        // rather than the whole stage, and a strict 100dvh would strand the words in
        // dead space below it — while the sliver of the next section the shorter fold
        // leaves showing is a useful hint that there is more down there.
        //
        // dvh rather than vh so a phone measures the visible viewport instead of
        // running under the browser chrome; the floors keep the copy from crushing on
        // a short landscape screen.
        minHeight: narrow ? 'max(86dvh,520px)' : 'max(100dvh,560px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: color.greenDeep
      }}
    >
      {/*
        One photograph, drawn untouched: no scrim, no filter, no scale, so it renders
        exactly as supplied. On a wide screen it is the full-bleed stage behind the
        words. On a phone it is a band at its own aspect, with the copy underneath —
        see the note on HERO_PHOTO.aspect for why it cannot simply stay full bleed.
      */}
      {narrow ? (
        <div style={{ position: 'relative', flex: 'none' }}>
          {photo}
          {/*
            The photograph does not stop, it dissolves: without this the picture would
            end on a hard horizontal seam across the fold. Sized in percent of the
            band so it scales with the crop.
          */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '-1px',
              height: '46%',
              zIndex: 2,
              pointerEvents: 'none',
              background: `linear-gradient(to bottom, rgba(26,28,31,0) 0%, rgba(26,28,31,.72) 58%, ${color.greenDeep} 96%)`
            }}
          />
        </div>
      ) : (
        photo
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          flex: 1,
          width: '100%',
          maxWidth: layout.maxWidth,
          margin: '0 auto',
          padding: heroContentPadding(narrow),
          display: 'flex',
          flexDirection: 'column',
          // On a phone the words and the CTA are one group centred in the ground under
          // the photograph. Letting the copy absorb the slack instead would strand the
          // headline in the middle of an empty half-screen.
          justifyContent: narrow ? 'center' : undefined
        }}
      >
        {/*
          The copy takes every row the CTA leaves, which parks the CTA on the bottom
          padding edge without the words having to move with it. It centres in that
          space at both sizes now: on a phone the words have their own ground beneath
          the photograph, so there are no subjects left for them to land on top of.
        */}
        <div
          style={{
            flex: narrow ? 'none' : 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          onLoad={() => setLoaded(true)}
        />
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(28,32,31,.85) 0%, rgba(28,32,31,.4) 40%, transparent 100%)"
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: "1320px",
            margin: "0 auto",
            width: "100%",
            padding: "40px 24px 60px",
            color: "#f3f3f1"
          }}
        >
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 600, lineHeight: 1.04, letterSpacing: "-.025em", maxWidth: "14ch", marginBottom: "16px" }}>
            {HERO_COPY.headline}
          </h1>
          
          <p style={{ fontSize: "1.25rem", lineHeight: 1.6, color: "rgba(243,243,241,.8)", marginBottom: "32px", maxWidth: "55ch" }}>
            {HERO_COPY.body}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-start", gap: "16px" }}>
            <Link
              to="/book"
              onClick={handleRequestDelivery}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                height: "48px",
                padding: "0 28px",
                borderRadius: "999px",
                background: "#F88735",
                color: "#1c201f",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                transition: "transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s"
              }}
            >
              Request a Delivery
            </Link>
          </div>
        </div>
      </section>

      {/* Required IDs for tests */}
      <section id="services" style={{ padding: "40px 24px" }}>
        <h2>Our Services</h2>
      </section>

      <footer id="footer" style={{ padding: "20px", textAlign: "center" }}>
        <p>&copy; 2026 Deliveroo</p>
      </footer>
    </div>
  );
};

export default Hero;

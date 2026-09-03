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
export const HERO_COPY = {
  headline: ['From anywhere to', 'your door'],
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
  const dispatch = useDispatch();
  const ctaHover = useSelector((state) => state.ui.ctaHover);
  const startBooking = useStartBooking();

  return (
    <Link
      to={BOOKING_PATH}
      onClick={startBooking}
      onMouseEnter={() => dispatch(setCtaHover(true))}
      onMouseLeave={() => dispatch(setCtaHover(false))}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '14px',
        height: KNOB,
        color: color.ink
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          filter: 'url(#ctaGoo) drop-shadow(0 13px 18px rgba(28,32,31,.4))'
        }}
      >
        <span style={{ flex: 1, alignSelf: 'stretch', borderRadius: '999px', background: color.orange }} />
        <span
          style={{
            position: 'relative',
            width: KNOB,
            alignSelf: 'stretch',
            borderRadius: '999px',
            background: color.orange,
            transform: ctaHover ? 'translateX(11px)' : 'none',
            transition: `transform .5s ${ease.spring}`
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
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(16px,2.1vw,26px)',
              animation: `riseIn .8s ${ease.out} both`
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: font.display,
                fontWeight: 600,
                fontSize: 'clamp(33px,5.1vw,66px)',
                lineHeight: 1.04,
                letterSpacing: '-.022em',
                color: color.white,
                textShadow: '0 2px 26px rgba(15,26,23,.6),0 1px 3px rgba(15,26,23,.5)'
              }}
            >
              {HERO_COPY.headline.map((line) => (
                <span key={line} style={{ display: 'block' }}>
                  {line}
                </span>
              ))}
            </h1>

            {/*
              The tagline sits on the bright part of the sunset, where a 88% white at
              body weight washed out. It is now solid white, a size and a weight up,
              and carries a tight dark halo under the wider glow so the letterforms
              keep an edge whatever the photograph does behind them.
            */}
            <p
              style={{
                margin: 0,
                maxWidth: '38ch',
                fontSize: 'clamp(17px,1.6vw,22px)',
                fontWeight: 600,
                letterSpacing: '-.008em',
                lineHeight: 1.5,
                color: color.white,
                textWrap: 'pretty',
                textShadow:
                  '0 1px 2px rgba(15,26,23,.85), 0 2px 10px rgba(15,26,23,.75), 0 4px 30px rgba(15,26,23,.6)'
              }}
            >
              {HERO_COPY.body}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            // Bottom left of the fold. Never stretched: the goo pill is drawn around
            // its own width and pulls into a dumbbell if forced to fill the row.
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            marginTop: 'clamp(20px,3vh,38px)',
            animation: `riseIn .8s ${ease.out} both`
          }}
        >
          <RequestCta />
        </div>
      </div>
    </div>
  );
}

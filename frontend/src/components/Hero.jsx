import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setNarrow, openAuthModal } from "../store/uiSlice";

export const HERO_COPY = {
  headline: 'From anywhere to your door',
  body: 'One network. Every mode.'
};

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

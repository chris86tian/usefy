// import Slider from "react-slick";
// import InstructorCard from "./InstructorCard";

// const SmoothCarousel = ({ items }) => {
//     const settings = {
//       dots: true,
//       infinite: true,
//       speed: 1000,
//       slidesToShow: 3,
//       slidesToScroll: 1,
//       autoplay: true,
//       autoplaySpeed: 3000,
//       cssEase: "cubic-bezier(0.87, 0.03, 0.41, 0.9)",
//       pauseOnHover: true,
//       responsive: [
//         {
//           breakpoint: 1024,
//           settings: {
//             slidesToShow: 2,
//             slidesToScroll: 1,
//           }
//         },
//         {
//           breakpoint: 640,
//           settings: {
//             slidesToShow: 1,
//             slidesToScroll: 1,
//           }
//         }
//       ]
//     };
  
//     return (
//       <div className="carousel-container relative px-4">
//         <style jsx global>{`
//           .carousel-container .slick-slide {
//             padding: 0 12px;
//             opacity: 0.5;
//             transition: all 0.3s ease;
//           }
          
//           .carousel-container .slick-slide.slick-active {
//             opacity: 1;
//           }
          
//           .carousel-container .slick-track {
//             display: flex !important;
//             align-items: stretch;
//             transition: transform 1000ms cubic-bezier(0.87, 0.03, 0.41, 0.9);
//           }
          
//           .carousel-container .slick-dots li button:before {
//             color: #fff;
//           }
          
//           .carousel-container .slick-dots li.slick-active button:before {
//             color: #fff;
//           }
          
//           .carousel-container .slick-list {
//             overflow: visible;
//             margin: 0 -12px;
//           }
          
//           .carousel-container .slick-slide > div {
//             height: 100%;
//           }
//         `}</style>
//         <Slider {...settings}>
//           {items.map((item: any) => (
//             <div key={item.id} className="h-full">
//               <InstructorCard {...item} />
//             </div>
//           ))}
//         </Slider>
//       </div>
//     );
// };
  
// export default SmoothCarousel;
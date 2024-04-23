// Typing text
var TxtType = function (el, toRotate, period) {
  this.toRotate = toRotate;
  this.el = el;
  this.loopNum = 0;
  this.period = parseInt(period, 10) || 2000;
  this.txt = "";
  this.tick();
  this.isDeleting = false;
};

TxtType.prototype.tick = function () {
  var i = this.loopNum % this.toRotate.length;
  var fullTxt = this.toRotate[i];

  if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
  } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
  }

  this.el.innerHTML = '<span class="hero-wrap">' + this.txt + "</span>";

  var that = this;
  var delta = 200 - Math.random() * 100;

  if (this.isDeleting) {
    delta /= 2;
  }

  if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
  } else if (this.isDeleting && this.txt === "") {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
  }

  setTimeout(function () {
    that.tick();
  }, delta);
};

window.onload = function () {
  var elements = document.getElementsByClassName("typewrite");
  for (var i = 0; i < elements.length; i++) {
    var toRotate = elements[i].getAttribute("data-type");
    var period = elements[i].getAttribute("data-period");
    if (toRotate) {
      new TxtType(elements[i], JSON.parse(toRotate), period);
    }
  }

  var css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = ".typewrite > .hero-wrap { border-right: 0.08em solid #fff}";
  document.body.appendChild(css);
};

// NavBar
document.addEventListener("DOMContentLoaded", function () {
  var navCheckbox = document.getElementById("nv_active");
  var navLinks = document.querySelectorAll(".nv_wrapper ul li a");

  function closeNavbar() {
    navCheckbox.checked = false;
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", closeNavbar);
  });
});

// We are perfect count Number
const counterNum = document.querySelectorAll(".count");
const speed = 200;

const options = {
  root: null,
  rootMargin: "0px",
  threshold: 0.5,
};

const handleIntersection = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      counterNum.forEach((curElem) => {
        const updateNumber = () => {
          const targetNumber = parseInt(curElem.dataset.number);
          const initialNum = parseInt(curElem.innerText);

          const incrementNumber = Math.max(Math.trunc(targetNumber / speed), 1);

          if (initialNum < targetNumber) {
            curElem.innerText = `${initialNum + incrementNumber}+`;
            setTimeout(updateNumber, 10);
          }
        };

        updateNumber();
      });
      observer.disconnect();
    }
  });
};

const observer = new IntersectionObserver(handleIntersection, options);
const counterSection = document.getElementById("counterSection");
if (counterSection) {
  observer.observe(counterSection);
}

// Benifits
document.addEventListener("DOMContentLoaded", function () {
  var swiper = new Swiper(".re-services", {
    slidesPerView: 2,
    spaceBetween: 30,
    pagination: {
      el: ".re-pag",
      clickable: true,
    },
    navigation: {
      nextEl: "#nextSlide",
      prevEl: "#prevSlide",
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 10,
      },
    },
  });
});

// about tdc
$(document).ready(function () {
  var originalContent = $("#content-to-replace").html();

  $(document).on("click", "#see-more-btn", function () {
    var additionalContent = $("#additional-paragraphs").html();
    $("#content-to-replace").html(additionalContent);
  });

  $(document).on("click", "#see-less-btn", function () {
    $("#content-to-replace").html(originalContent);
  });
});

// what we offer
var swiper = new Swiper(".blog-slider", {
  spaceBetween: 30,
  /* autoplay: true,
  autoplayTimeout: 200000,  */
  smartSpeed: 450,
  effect: "fade",
  loop: true,
  mouseWheel: {
    invert: false,
  },
  pagination: {
    el: ".blog-slider__pagination",
    clickable: true,
  },
});

// tagline video
document.addEventListener("DOMContentLoaded", function () {
  var video = document.getElementById("background-video");

  video.removeAttribute("controls");
  video.play();
});


/* Efficient Service Suite */
let stack = document.querySelector(".es-stack");

[...stack.children].reverse().forEach((i) => stack.append(i));

stack.addEventListener("click", swap);

function swap(e) {
  let card = document.querySelector(".es-card:last-child");
  if (e.target !== card) return;
  card.style.animation = "swap 700ms forwards";

  setTimeout(() => {
    card.style.animation = "";
    stack.prepend(card);
  }, 700);
}

let cards = document.querySelectorAll(".es-card");
function rotateCards() {
  let angle = 90;
  cards.forEach((card) => {
    if (card.classList.contains("active")) {
      card.style.transform = `translate(-50%, -120vh) rotate(-100deg)`;
    } else {
      card.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      angle = angle - 10;
    }
  });
}

rotateCards();

/* Workout Program */
const panels = document.querySelectorAll(".panel");

panels.forEach((panel) => {
  panel.addEventListener("click", () => {
    removeActiveClasses();
    panel.classList.add("active");
  });
});

function removeActiveClasses() {
  panels.forEach((panel) => {
    panel.classList.remove("active");
  });
}

// client transformation

const wrapper = document.querySelector(".CT-wrapper"),
  carousel = document.querySelector(".CT-carousel"),
  images = document.querySelectorAll(".ct-img"),
  buttons = document.querySelectorAll(".button");

let imageIndex = 1,
  intervalId;

const autoSlide = () => {
  intervalId = setInterval(() => slideImage(++imageIndex), 6000);
};

autoSlide();

const slideImage = () => {
  imageIndex =
    imageIndex === images.length
      ? 0
      : imageIndex < 0
      ? images.length - 1
      : imageIndex;
  carousel.style.transform = `translate(-${imageIndex * 100}%)`;
};

const updateClick = (e) => {
  clearInterval(intervalId);
  imageIndex += e.target.id === "next" ? 1 : -1;
  slideImage(imageIndex);
  autoSlide();
};

buttons.forEach((button) => button.addEventListener("click", updateClick));
wrapper.addEventListener("mouseover", () => clearInterval(intervalId));
wrapper.addEventListener("mouseleave", autoSlide);

// Reviews
$(".testimonials-container").owlCarousel({
  loop: true,
  /*  autoplay:true, */
  autoplayTimeout: 6000,
  margin: 10,
  nav: true,
  navText: [
    "<i class='fa-solid fa-arrow-left'></i>",
    "<i class='fa-solid fa-arrow-right'></i>",
  ],
  responsive: {
    0: {
      items: 1,
      nav: true,
      dots: false,
    },
    600: {
      items: 1,
      nav: true,
      dots: false,
    },
    768: {
      items: 2,
    },
  },
});

const btn = document.querySelector(".read-more-btn");
const text = document.querySelector(".card__read-more");
const cardHolder = document.querySelector(".testimonials-container");

cardHolder.addEventListener("click", (e) => {
  const current = e.target;
  const isReadMoreBtn = current.className.includes("read-more-btn");
  if (!isReadMoreBtn) return;
  const currentText = e.target.parentNode.querySelector(".card__read-more");
  currentText.classList.toggle("card__read-more--open");
  current.textContent = current.textContent.includes("Read More...")
    ? "Read Less..."
    : "Read More...";
});



// Whatsapp Icon
let isChatboxVisible = false;
const chatbox = document.querySelector(".WA_Chat_Widget .WA_ChatBox");

function hideChatbox() {
  isChatboxVisible = false;
  chatbox.style.display = "none";
}

function toggleChatbox() {
  isChatboxVisible = !isChatboxVisible;
  chatbox.style.display = isChatboxVisible ? "block" : "none";
}

function openWhatsApp() {
  var phoneNumber = "+91 9004491160";
  var phoneNumbers = "9004491160";
  var message = encodeURIComponent(
    "Heyy!! I'm interested in diet counseling and seeking information on available services"
  );

  var isMobile = /Android/i.test(navigator.userAgent);

  var isMobiles = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  var whatsappLink = isMobile
    ? "https://wa.me/" + phoneNumber + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  var whatsappLinks = isMobiles
    ? "https://wa.me/" + phoneNumbers + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  window.open(whatsappLink, "_blank");

  window.open(whatsappLinks, "_blank");

  setTimeout(function () {
    window.location.href = "";
  }, 2000);
}

function openWpToBookAppo() {
  var phoneNumber = "+91 9004491160";
  var phoneNumbers = "9004491160";
  var message = encodeURIComponent(
    "Heyy!! I'm interested in diet counseling and seeking information on available services"
  );

  var isMobile = /Android/i.test(navigator.userAgent);

  var isMobiles = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  var whatsappLink = isMobile
    ? "https://wa.me/" + phoneNumber + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  var whatsappLinks = isMobiles
    ? "https://wa.me/" + phoneNumbers + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  window.open(whatsappLink, "_blank");

  window.open(whatsappLinks, "_blank");

  setTimeout(function () {
    window.location.href = "";
  }, 2000);
}

function openWpToEnroll() {
  var phoneNumber = "+91 9004491160";
  var phoneNumbers = "9004491160";
  var message = encodeURIComponent(
    "Heyy!! I'm interested in diet counseling and seeking information on available services"
  );

  var isMobile = /Android/i.test(navigator.userAgent);

  var isMobiles = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  var whatsappLink = isMobile
    ? "https://wa.me/" + phoneNumber + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  var whatsappLinks = isMobiles
    ? "https://wa.me/" + phoneNumbers + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  window.open(whatsappLink, "_blank");

  window.open(whatsappLinks, "_blank");

  setTimeout(function () {
    window.location.href = "";
  }, 2000);
}

function openWpToOther() {
  var phoneNumber = "+91 9004491160";
  var phoneNumbers = "9004491160";
  var message = encodeURIComponent(" ");

  var isMobile = /Android/i.test(navigator.userAgent);

  var isMobiles = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  var whatsappLink = isMobile
    ? "https://wa.me/" + phoneNumber + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  var whatsappLinks = isMobiles
    ? "https://wa.me/" + phoneNumbers + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  window.open(whatsappLink, "_blank");

  window.open(whatsappLinks, "_blank");

  setTimeout(function () {
    window.location.href = "";
  }, 2000);
}

/* Book Appoi */
function openWP() {
  var phoneNumber = "+91 9004491160";
  var phoneNumbers = "9004491160";
  var message = encodeURIComponent("SLOTS");

  var isMobile = /Android/i.test(navigator.userAgent);

  var isMobiles = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  var whatsappLink = isMobile
    ? "https://wa.me/" + phoneNumber + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  var whatsappLinks = isMobiles
    ? "https://wa.me/" + phoneNumbers + "?text=" + message
    : "https://web.whatsapp.com/send?phone=" + phoneNumber + "&text=" + message;

  window.open(whatsappLink, "_blank");

  window.open(whatsappLinks, "_blank");

  setTimeout(function () {
    window.location.href = "";
  }, 2000);
}

AOS.init({
  offset: 350,
  duration: 300,
});

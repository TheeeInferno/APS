(function () {
    "use strict";

    const config = window.APS_CONFIG || {};
    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".links");

    function closeMenu() {
        if (!menuToggle || !nav) return;
        menuToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
    }

    if (menuToggle && nav) {
        menuToggle.addEventListener("click", function () {
            const open = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!open));
            nav.classList.toggle("is-open", !open);
        });

        nav.addEventListener("click", function (event) {
            if (event.target.closest("a")) closeMenu();
        });

        document.addEventListener("click", function (event) {
            if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeMenu();
                menuToggle.focus();
            }
        });
    }

    document.querySelectorAll("[data-business]").forEach(function (element) {
        const key = element.dataset.business;
        const value = config[key];
        if (value) element.textContent = value;
    });

    document.querySelectorAll("[data-service-areas]").forEach(function (container) {
        const areas = Array.isArray(config.serviceAreas) ? config.serviceAreas : [];
        if (!areas.length) return;
        container.replaceChildren(...areas.map(function (area) {
            const item = document.createElement("span");
            item.className = "pill";
            item.textContent = area;
            return item;
        }));
    });

    const carousel = document.querySelector("[data-hero-carousel]");
    if (carousel) {
        const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
        const controls = Array.from(carousel.querySelectorAll("[data-hero-slide]"));
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let currentSlide = 0;
        let intervalId;

        function showSlide(index) {
            currentSlide = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === currentSlide);
            });
            controls.forEach(function (control, controlIndex) {
                control.classList.toggle("is-active", controlIndex === currentSlide);
                control.setAttribute("aria-current", String(controlIndex === currentSlide));
            });
        }

        function startCarousel() {
            if (reducedMotion || slides.length < 2) return;
            clearInterval(intervalId);
            intervalId = window.setInterval(function () {
                showSlide(currentSlide + 1);
            }, 7000);
        }

        controls.forEach(function (control, index) {
            control.addEventListener("click", function () {
                showSlide(index);
                startCarousel();
            });
        });

        carousel.addEventListener("mouseenter", function () { clearInterval(intervalId); });
        carousel.addEventListener("mouseleave", startCarousel);
        carousel.addEventListener("focusin", function () { clearInterval(intervalId); });
        carousel.addEventListener("focusout", startCarousel);
        startCarousel();
    }

    const quoteForm = document.querySelector("[data-quote-form]");
    if (!quoteForm) return;

    const feedback = quoteForm.querySelector(".form-feedback");
    quoteForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!quoteForm.checkValidity()) {
            quoteForm.classList.add("was-validated");
            quoteForm.reportValidity();
            return;
        }

        const submit = quoteForm.querySelector("button[type=submit]");
        submit.disabled = true;
        submit.textContent = "Sending Request…";
        feedback.hidden = true;

        try {
            if (!config.quoteEndpoint) {
                throw new Error("Quote delivery has not been configured yet.");
            }

            const response = await fetch(config.quoteEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.fromEntries(new FormData(quoteForm)))
            });
            if (!response.ok) throw new Error("Unable to send your request right now.");

            quoteForm.reset();
            feedback.textContent = "Thank you. Your request has been received. An APS representative will contact you shortly.";
            feedback.className = "form-feedback success";
        } catch (error) {
            feedback.textContent = error.message;
            feedback.className = "form-feedback error";
        } finally {
            feedback.hidden = false;
            submit.disabled = false;
            submit.textContent = "Request a Quote";
        }
    });
}());

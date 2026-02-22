export function switchView() {
    const navButtons = document.querySelectorAll("[data-link]")
    const sections = document.querySelectorAll(".view-section")

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-link")

            // 1. Gestion de la transition
            const currentSection = Array.from(sections).find(s => !s.classList.contains("hidden"));
            const targetSection = document.getElementById(targetId);

            if (currentSection && targetSection && currentSection !== targetSection) {
                // Etape 1: Fade Out
                currentSection.classList.add("transition-opacity", "opacity-0");
                currentSection.classList.remove("opacity-100");

                setTimeout(() => {
                    // Etape 2: Switch (après l'animation)
                    currentSection.classList.add("hidden");
                    currentSection.classList.remove("transition-opacity", "opacity-0");

                    // Préparation de la nouvelle section (invisible mais présente)
                    targetSection.classList.remove("hidden");
                    targetSection.classList.add("opacity-0", "transition-opacity");

                    // Force reflow
                    void targetSection.offsetWidth;

                    // Etape 3: Fade In
                    targetSection.classList.remove("opacity-0");
                    targetSection.classList.add("opacity-100");
                }, 200); // Durée de la transition
            } else if (!currentSection && targetSection) {
                // Premier chargement (pas d'animation de sortie)
                targetSection.classList.remove("hidden");
                targetSection.classList.add("animate-fade-in");
            }

            // 2. Mise à jour des boutons (immédiat)
            document.querySelectorAll(".sidebar-icon, .bottom-icon").forEach(btn => {
                btn.classList.remove("active", "text-white");
                btn.classList.add("text-gray-400");
            });

            button.classList.add("active", "text-white");
            button.classList.remove("text-gray-400");

            // 4. Enregistrement de l'état
            localStorage.setItem('activeView', targetId)
        })
    })
}
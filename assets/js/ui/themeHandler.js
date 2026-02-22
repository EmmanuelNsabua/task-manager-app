export function themeHandler() {
    const togglers = document.querySelectorAll('[data-theme-toggle]');

    togglers.forEach(button => {
        button.addEventListener('click', () => {
            // 1. On bascule la classe
            document.documentElement.classList.toggle('dark');

            // 2. On vérifie MAINTENANT si la classe est présente
            const isDarkNow = document.documentElement.classList.contains('dark');

            // 3. On enregistre le résultat exact
            if (isDarkNow) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
            
            console.log("Thème enregistré :", localStorage.getItem('theme')); // Pour vérifier dans la console
        });
    });
}
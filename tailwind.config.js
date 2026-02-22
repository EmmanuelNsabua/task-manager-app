module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Remplace la police par défaut 'sans'
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      spacing: {
        '128': '32rem', // 512px
        '144': '36rem', // 576px
        '160': '40rem', // 640px
        '192': '48rem', // 768px
        '224': '56rem', // 896px
        '256': '64rem', // 1024px
      },
      // Themed colors using CSS variables
      colors: {
        themed: {
          body: 'var(--bg-body)',
          panel: 'var(--bg-panel)',
          card: 'var(--bg-card)',
          'card-alt': 'var(--bg-card-alt)',
          sidebar: 'var(--bg-sidebar)',
          input: 'var(--bg-input)',
        },
        text: {
          themed: 'var(--text-primary)',
          'themed-secondary': 'var(--text-secondary)',
          'themed-muted': 'var(--text-muted)',
          'themed-inverse': 'var(--text-inverse)',
        },
        border: {
          themed: 'var(--border-default)',
          'themed-light': 'var(--border-light)',
          'themed-focus': 'var(--border-focus)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-primary-hover)',
          danger: 'var(--accent-danger)',
          'danger-hover': 'var(--accent-danger-hover)',
        },
      },
    },
  },
}

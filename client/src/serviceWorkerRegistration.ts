// Эта функция регистрирует Service Worker
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
      
      // Регистрируем Service Worker
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Проверяем обновления каждые час
          setInterval(() => {
            registration.update();
          }, 3600000);
          
          // Проверяем обновления при загрузке страницы
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Новый контент доступен, уведомляем пользователя
                  console.log('New content is available; please refresh.');
                } else {
                  // Контент закэширован для офлайн использования
                  console.log('Content cached for offline use.');
                }
              }
            };
          };
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}


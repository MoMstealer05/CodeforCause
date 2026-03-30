// public/sw.js
// Service Worker — handles scheduled push notifications for CFC events

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Listen for messages from the dashboard to schedule notifications
self.addEventListener("message", event => {
  if (event.data?.type === "SCHEDULE_NOTIFICATION") {
    const { delay, title, body, tag, url } = event.data;

    // Use setTimeout to fire the notification after the delay
    // Note: SW can be killed and restarted by browser, so for production
    // a push server (FCM) is more reliable. This works great for short delays.
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        tag,           // prevents duplicate notifications for same event
        icon: "/CFC.png",
        badge: "/CFC.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: { url },
        actions: [
          { action: "open",    title: "View Event" },
          { action: "dismiss", title: "Dismiss"    },
        ],
      });
    }, delay);
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", event => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      // If dashboard already open, focus it
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
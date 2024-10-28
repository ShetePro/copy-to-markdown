const alertTrack = [];

export function createAlert(message, options = {}) {
  const { duration = 2000 } = options;
  const alert = document.createElement("div");
  alert.classList.add("popup-alert");
  const icon = document.createElement("span");
  icon.classList.add("alert-icon");
  const title = document.createElement("span");
  title.classList.add("alert-title");
  title.innerText = message;
  alert.append(icon, title);
  const lastAlert = alertTrack.at(-1)?.offsetTop || 40;
  const style = `
   top: ${lastAlert + 40}px`;
  alert.setAttribute("style", style);
  document.body.append(alert);
  alertTrack.push(alert);
  setTimeout(() => {
    alert.classList.add("hide-alert");
    hideHandle();
  }, duration);
}

function hideHandle(duration) {
  const alert = alertTrack.shift();
  setTimeout(() => {
    alert.remove();
    alertTrack.forEach((item, index) => {
      const style = `
    top: ${(index + 1) * 40}px`;
      item.setAttribute("style", style);
    });
  }, 500);
}

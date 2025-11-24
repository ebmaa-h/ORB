const confirmAction = (action = "proceed") => {
  if (typeof window === "undefined" || typeof window.confirm !== "function") return true;
  const message = `Are you sure you want to ${action}?`;
  return window.confirm(message);
};

export default confirmAction;

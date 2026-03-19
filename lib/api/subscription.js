export function createSubscriptionCalls(api) {
    return {
        getStatus: () => api.subscription.getStatus(),
        createIntent: (plan) => api.subscription.createIntent(plan),
        cancelIntent: (subscriptionId) => api.subscription.cancelIntent(subscriptionId),
        createPortal: () => api.subscription.createPortal(),
    };
}

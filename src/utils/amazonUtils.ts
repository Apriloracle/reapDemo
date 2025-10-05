export const appendReferralCode = (url: string): string => {
  if (url.includes('amazon.com')) {
    const urlObject = new URL(url);
    urlObject.searchParams.set('linkCode', 'll1');
    urlObject.searchParams.set('tag', 'newbium-20');
    return urlObject.toString();
  }
  return url;
};

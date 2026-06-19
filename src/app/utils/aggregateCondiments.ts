import { Condiment, AggregatedCondiment, TasteProfile } from '../types';

export function aggregateCondiments(condiments: Condiment[]): AggregatedCondiment[] {
  const grouped = new Map<string, Condiment[]>();

  condiments.forEach(condiment => {
    const key = condiment.name.toLowerCase().trim();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(condiment);
  });

  const aggregated: AggregatedCondiment[] = [];

  grouped.forEach((posts, _key) => {
    const totalRepeatRating = posts.reduce((sum, p) => sum + (p.repeatRating || 0), 0);
    const averageRepeatRating = totalRepeatRating / posts.length;

    const avgTaste: TasteProfile = {
      sweetness: posts.reduce((sum, p) => sum + (p.tasteProfile?.sweetness || 0), 0) / posts.length,
      sourness: posts.reduce((sum, p) => sum + (p.tasteProfile?.sourness || 0), 0) / posts.length,
      bitterness: posts.reduce((sum, p) => sum + (p.tasteProfile?.bitterness || 0), 0) / posts.length,
      umami: posts.reduce((sum, p) => sum + (p.tasteProfile?.umami || 0), 0) / posts.length,
      saltiness: posts.reduce((sum, p) => sum + (p.tasteProfile?.saltiness || 0), 0) / posts.length,
      richness: posts.reduce((sum, p) => sum + (p.tasteProfile?.richness || 0), 0) / posts.length,
      aroma: posts.reduce((sum, p) => sum + (p.tasteProfile?.aroma || 0), 0) / posts.length
    };

    const sortedPosts = [...posts].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    aggregated.push({
      name: posts[0].name,
      category: posts[0].category,
      origin: posts[0].origin,
      averageRepeatRating,
      postCount: posts.length,
      posts: sortedPosts,
      averageTasteProfile: avgTaste,
      representativeImage: posts.find(p => p.imageUrl)?.imageUrl || ''
    });
  });

  return aggregated.sort((a, b) => b.averageRepeatRating - a.averageRepeatRating);
}

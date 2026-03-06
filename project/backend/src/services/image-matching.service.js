/**
 * Image Matching Service
 *
 * Fuzzy matching engine that combines Cloudinary AI tags (60% weight)
 * with filename matching (40% weight) using Levenshtein distance
 * to find the best product match for each uploaded image.
 */

/**
 * Levenshtein distance between two strings.
 */
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Normalise a string for matching: lowercase, strip punctuation, collapse spaces.
 */
function normalise(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Score how well a set of AI tags matches a product name (0–1).
 * Checks for substring containment and Levenshtein similarity.
 */
function scoreByTags(tags, productName) {
  if (!tags || tags.length === 0) return 0;

  const normProduct = normalise(productName);
  const productWords = normProduct.split(' ');
  let bestScore = 0;

  for (const tag of tags) {
    const normTag = normalise(tag);

    // Exact containment
    if (normProduct.includes(normTag) || normTag.includes(normProduct)) {
      const overlap = Math.min(normTag.length, normProduct.length) /
        Math.max(normTag.length, normProduct.length);
      bestScore = Math.max(bestScore, 0.7 + overlap * 0.3);
      continue;
    }

    // Word-level overlap
    const tagWords = normTag.split(' ');
    let wordMatches = 0;
    for (const tw of tagWords) {
      for (const pw of productWords) {
        if (tw === pw || (tw.length > 3 && pw.includes(tw)) || (pw.length > 3 && tw.includes(pw))) {
          wordMatches++;
          break;
        }
      }
    }
    if (tagWords.length > 0) {
      const wordScore = wordMatches / Math.max(tagWords.length, productWords.length);
      bestScore = Math.max(bestScore, wordScore);
    }

    // Levenshtein similarity on tag vs product name
    const maxLen = Math.max(normTag.length, normProduct.length);
    if (maxLen > 0) {
      const distance = levenshteinDistance(normTag, normProduct);
      const similarity = 1 - distance / maxLen;
      bestScore = Math.max(bestScore, similarity);
    }
  }

  return Math.min(bestScore, 1);
}

/**
 * Score how well a filename matches a product name (0–1).
 */
function scoreByFilename(filename, productName) {
  // Strip extension, replace separators with spaces
  const normFile = normalise(
    filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\d{10,}/g, ''),
  );
  const normProduct = normalise(productName);

  if (!normFile || !normProduct) return 0;

  // Exact match
  if (normFile === normProduct) return 1;

  // Containment
  if (normFile.includes(normProduct) || normProduct.includes(normFile)) {
    return 0.7 + (Math.min(normFile.length, normProduct.length) /
      Math.max(normFile.length, normProduct.length)) * 0.3;
  }

  // Levenshtein
  const maxLen = Math.max(normFile.length, normProduct.length);
  if (maxLen === 0) return 0;
  const distance = levenshteinDistance(normFile, normProduct);
  return 1 - distance / maxLen;
}

/**
 * Determine confidence level from a combined score.
 */
function getConfidence(score) {
  if (score >= 0.95) return 'exact';
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  if (score >= 0.3) return 'low';
  return null;
}

/**
 * Match uploaded images to products.
 *
 * @param {Array<{ originalFilename: string, cloudinaryUrl: string, publicId: string, tags: string[] }>} uploadedImages
 * @param {Array<{ id: string, name: string, image_url: string | null }>} products
 * @returns {{ matched: Array, unmatched: Array }}
 */
export function matchImagesToProducts(uploadedImages, products) {
  const matched = [];
  const unmatched = [];
  const usedProductIds = new Set();

  for (const image of uploadedImages) {
    // Skip failed uploads
    if (!image.cloudinaryUrl) {
      unmatched.push({
        image: { originalFilename: image.originalFilename, cloudinaryUrl: null, publicId: null, tags: image.tags || [] },
        product: null,
        confidence: null,
        score: 0,
      });
      continue;
    }

    let bestProduct = null;
    let bestScore = 0;

    for (const product of products) {
      if (usedProductIds.has(product.id)) continue;

      const tagScore = scoreByTags(image.tags, product.name);
      const fileScore = scoreByFilename(image.originalFilename, product.name);

      // Weighted combination: 60% AI tags, 40% filename
      const combined = tagScore * 0.6 + fileScore * 0.4;

      if (combined > bestScore) {
        bestScore = combined;
        bestProduct = product;
      }
    }

    const confidence = getConfidence(bestScore);
    const entry = {
      image: {
        originalFilename: image.originalFilename,
        cloudinaryUrl: image.cloudinaryUrl,
        publicId: image.publicId,
        tags: image.tags || [],
      },
      product: confidence ? { id: bestProduct.id, name: bestProduct.name, image_url: bestProduct.image_url } : null,
      confidence,
      score: Math.round(bestScore * 100) / 100,
    };

    if (confidence) {
      usedProductIds.add(bestProduct.id);
      matched.push(entry);
    } else {
      unmatched.push(entry);
    }
  }

  return { matched, unmatched };
}

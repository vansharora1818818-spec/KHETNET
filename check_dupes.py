import esprima

def check_duplicates(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Remove 'export const translations =' to make it a valid JS object or similar
    # Actually, we can just look for the object declaration
    
    # Simple check: find all "key:" patterns
    import re
    # Look for patterns like '  key_name:'
    en_start = content.find('en: {')
    en_end = content.find('  },', en_start)
    hi_start = content.find('hi: {')
    hi_end = content.find('  },', hi_start)
    
    def get_keys(text):
        keys = re.findall(r'(\w+):', text)
        return keys

    en_keys = get_keys(content[en_start:en_end])
    hi_keys = get_keys(content[hi_start:hi_end])
    
    from collections import Counter
    en_counts = Counter(en_keys)
    hi_counts = Counter(hi_keys)
    
    en_dupes = [k for k, v in en_counts.items() if v > 1]
    hi_dupes = [k for k, v in hi_counts.items() if v > 1]
    
    print(f"EN Dupes: {en_dupes}")
    print(f"HI Dupes: {hi_dupes}")

if __name__ == "__main__":
    check_duplicates('src/translations.ts')

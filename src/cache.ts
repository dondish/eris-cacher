/**
 * The basic interface for a cache
 * 
 * @remarks
 * The cache doesn't have to be used for all types, it can be configured for each use case.
 */
export interface Cache<T> {
    /**
     * Get an entry stored in the cache, can be async.
     * @param id the id associated with the value.
     */
    get(id: string): T | Promise<T>
    /**
     * Set an entry in the cache, can be async.
     * @param id the id to fetch by later on, must be a string.
     * @param value the value to cache.
     */
    set(id: string, value: T): void | Promise<T>;
    /**
     * Delete a value stored in the cache, can be async.
     * @param id the id associated with the value.
     */
    delete(id: string): void;
    /**
     * Finds the first value where the function matches, can be async
     * @param f the function to match values with.
     * 
     * @remarks
     * It's not used within the library.
     */
    find(f: (T, string) => boolean): T | Promise<T>;
    /**
     * Closes the cache.
     * 
     * @remarks
     * Developers should put here the code to close all types of connectors.
     */
    close(): void | Promise<void>;
}

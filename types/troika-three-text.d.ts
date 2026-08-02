// troika-three-text ships no types; we only reach for one function of it.
declare module "troika-three-text" {
  export function configureTextBuilder(config: { useWorker?: boolean }): void;
}

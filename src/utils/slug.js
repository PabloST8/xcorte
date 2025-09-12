export function slugify(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^\w\s-@.]/g, "") // keep word chars, space, dash, @, .
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function enterpriseCandidates(e) {
  const email = e?.email || "";
  const name = e?.name || "";
  const id = e?.id || "";
  const local = email.split("@")[0] || email;
  // Lista de candidatos inclui agora:
  // - slug do nome
  // - slug do nome SEM hifens (para URLs digitadas pelo usuário que juntam palavras)
  // - slug do id (quando fornecido manualmente no seed / Firestore)
  // - slug da parte local do email
  // - slug do email completo
  const nameSlug = slugify(name);
  const nameNoHyphen = slugify(name.replace(/-/g, " ")); // remove hifens internos para gerar variante "xcortes"
  const idSlug = slugify(id);
  return Array.from(
    new Set(
      [nameSlug, nameNoHyphen, idSlug, slugify(local), slugify(email)].filter(
        Boolean
      )
    )
  );
}

import { useEnterprise } from "../contexts/EnterpriseContext";

function EnterpriseDebug() {
  const { currentEnterprise } = useEnterprise();

  if (!currentEnterprise) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800">
        Empresa não carregada
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 text-blue-800 rounded">
      <h3 className="font-bold">Dados da Empresa Atual:</h3>
      <p>
        <strong>Nome:</strong> {currentEnterprise.name}
      </p>
      <p>
        <strong>Email:</strong> {currentEnterprise.email}
      </p>
      <p>
        <strong>Endereço:</strong>{" "}
        {currentEnterprise.address || "NÃO INFORMADO"}
      </p>
      <p>
        <strong>Telefone:</strong> {currentEnterprise.phone || "NÃO INFORMADO"}
      </p>
    </div>
  );
}

export default EnterpriseDebug;

<#include "header.ftl">

<#if content.body??>
${content.body}
<#else>
  <#include "index.html">
</#if>

<#include "footer.ftl">
